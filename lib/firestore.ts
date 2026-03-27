import { BRAND, PRODUCTS } from '../constants';
import { Customer, Flavor, Order, Region, Settings } from '../types';
import { baseStorePath, buildCollectionUrl, buildDocUrl } from './firebase';

const defaultWhatsappTemplate = `Olá! Quero fazer um pedido de atacado.\n\nNome: {nome}\nTelefone: {telefone}\nTipo de negócio: {tipoNegocio}\nBairro: {bairro}\nForma de entrega: {formaEntrega}\n\nPedido:\n{itensFormatados}\n\nTotal de unidades: {totalUnidades}\nSubtotal estimado: {subtotal}\n\nObservações: {observacoes}`;

const nowIso = () => new Date().toISOString();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

const toFirestoreValue = (value: unknown): FirestoreValue => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      fields[key] = toFirestoreValue(val);
    });
    return { mapValue: { fields } };
  }

  return { stringValue: String(value) };
};

const fromFirestoreValue = (value: FirestoreValue | undefined): unknown => {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map((entry) => fromFirestoreValue(entry));
  if ('mapValue' in value) {
    const out: Record<string, unknown> = {};
    Object.entries(value.mapValue.fields || {}).forEach(([key, val]) => {
      out[key] = fromFirestoreValue(val);
    });
    return out;
  }

  return null;
};

const parseDocument = <T,>(doc: { name: string; fields?: Record<string, FirestoreValue> }): T => {
  const data: Record<string, unknown> = {};
  Object.entries(doc.fields || {}).forEach(([key, value]) => {
    data[key] = fromFirestoreValue(value);
  });

  if (!data.id) {
    data.id = doc.name.split('/').pop();
  }

  return data as T;
};

const requestFirestore = async <T,>(url: string, options: RequestInit = {}, idToken?: string): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao acessar Firestore');
  }

  return (await response.json()) as T;
};

const setDocument = async (docPath: string, payload: Record<string, unknown>, idToken?: string) => {
  await requestFirestore(
    buildDocUrl(docPath),
    {
      method: 'PATCH',
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, toFirestoreValue(value)])),
      }),
    },
    idToken,
  );
};

const createDocument = async (collectionPath: string, payload: Record<string, unknown>, idToken?: string, documentId?: string) => {
  const query = documentId ? `documentId=${encodeURIComponent(documentId)}` : '';
  const url = buildCollectionUrl(collectionPath, query);

  const doc = await requestFirestore<{ name: string }>(
    url,
    {
      method: 'POST',
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, toFirestoreValue(value)])),
      }),
    },
    idToken,
  );

  return doc.name.split('/').pop() || '';
};

const listCollection = async <T,>(collectionPath: string, idToken?: string) => {
  const response = await requestFirestore<{ documents?: { name: string; fields?: Record<string, FirestoreValue> }[] }>(
    buildCollectionUrl(collectionPath, 'pageSize=200'),
    { method: 'GET' },
    idToken,
  );

  return (response.documents || []).map((doc) => parseDocument<T>(doc));
};

const getDocument = async <T,>(docPath: string, idToken?: string): Promise<T | null> => {
  try {
    const response = await requestFirestore<{ name: string; fields?: Record<string, FirestoreValue> }>(buildDocUrl(docPath), { method: 'GET' }, idToken);
    return parseDocument<T>(response);
  } catch {
    return null;
  }
};

export const getAdminUserById = async (userId: string, idToken: string) =>
  getDocument<{ id: string }>(`${baseStorePath}/adminUsers/${userId}`, idToken);

export const ensureInitialFirestoreData = async () => {
  const flavors = await listCollection<Flavor>(`${baseStorePath}/sabores`);
  if (flavors.length === 0) {
    await Promise.all(
      PRODUCTS.map((product, index) => {
        const id = `flavor-${product.id}`;
        const payload: Flavor = {
          id,
          name: product.name,
          slug: slugify(product.name),
          description: product.description,
          imageUrl: product.image,
          priceWholesale: 7.5,
          active: true,
          featured: index < 4,
          sortOrder: index + 1,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        return setDocument(`${baseStorePath}/sabores/${id}`, payload);
      }),
    );
  }

  const settings = await getSettings();
  if (!settings) {
    await setDocument(`${baseStorePath}/configuracoes/geral`, {
      whatsappNumber: BRAND.whatsapp,
      minimumOrderUnits: 20,
      businessHours: BRAND.hours,
      defaultDeliveryFee: 0,
      whatsappTemplate: defaultWhatsappTemplate,
      updatedAt: nowIso(),
    });
  }
};

export const getSettings = async (): Promise<Settings | null> => getDocument<Settings>(`${baseStorePath}/configuracoes/geral`);

export const saveSettings = async (payload: Settings, idToken: string) => {
  await setDocument(`${baseStorePath}/configuracoes/geral`, {
    ...payload,
    updatedAt: nowIso(),
  }, idToken);
};

export const getFlavors = async () => {
  const flavors = await listCollection<Flavor>(`${baseStorePath}/sabores`);
  return flavors.sort((a, b) => a.sortOrder - b.sortOrder);
};

export const saveFlavor = async (flavor: Flavor, idToken: string) => {
  await setDocument(`${baseStorePath}/sabores/${flavor.id}`, { ...flavor, updatedAt: nowIso() }, idToken);
};

export const createFlavor = async (payload: Flavor, idToken: string) => {
  await setDocument(`${baseStorePath}/sabores/${payload.id}`, payload, idToken);
};

export const getRegions = async () => listCollection<Region>(`${baseStorePath}/regioes`);

export const saveRegion = async (region: Region, idToken: string) => {
  await setDocument(`${baseStorePath}/regioes/${region.id}`, { ...region, updatedAt: nowIso() }, idToken);
};

export const createRegion = async (region: Region, idToken: string) => {
  await setDocument(`${baseStorePath}/regioes/${region.id}`, region, idToken);
};

export const getOrders = async () => {
  const orders = await listCollection<Order>(`${baseStorePath}/pedidos`);
  return orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const saveOrder = async (order: Order, idToken: string) => {
  await setDocument(`${baseStorePath}/pedidos/${order.id}`, { ...order, updatedAt: nowIso() }, idToken);
};

export const getCustomers = async () => {
  const customers = await listCollection<Customer>(`${baseStorePath}/clientes`);
  return customers.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

export const upsertCustomerByPhone = async (customer: Customer) => {
  await setDocument(`${baseStorePath}/clientes/${customer.id}`, customer);
};

export const createOrder = async (order: Omit<Order, 'id'>) => {
  const id = await createDocument(`${baseStorePath}/pedidos`, order);
  return { ...order, id };
};

export const formatDefaultTemplate = () => defaultWhatsappTemplate;
