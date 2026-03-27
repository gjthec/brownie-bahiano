import { BRAND, PRODUCTS } from '../constants';
import { Customer, Flavor, Order, Region, Settings } from '../types';
import { baseStorePath, buildCollectionUrl, buildDocUrl } from './firebase';

export interface LandingConfig {
  hero_title: string;
  hero_subtitle: string;
  hero_badge: string;
  hero_primary_button: string;
  hero_secondary_button: string;
  whatsapp_cta_text: string;
  beneficios: string;
  sabores_destaque: string;
  faq: string;
  textos_do_formulario_final: string;
}

export interface SuperAdminSecurityConfig {
  masterPassword: string;
  adminEnabled: boolean;
  sessionDurationMinutes: number;
  accessMode: 'master_password';
}

const defaultWhatsappTemplate = `Olá! Quero fazer um pedido de atacado.\n\nNome: {nome}\nTelefone: {telefone}\nTipo de negócio: {tipoNegocio}\nBairro: {bairro}\nForma de entrega: {formaEntrega}\n\nPedido:\n{itensFormatados}\n\nTotal de unidades: {totalUnidades}\nSubtotal estimado: {subtotal}\n\nObservações: {observacoes}`;

const defaultLandingConfig: LandingConfig = {
  hero_title: 'Brownies para revenda com alta saída e ótima margem.',
  hero_subtitle: 'Produção própria • Receita artesanal • Reposição rápida • Vende o ano todo',
  hero_badge: `ATACADO PARA REVENDEDORES EM ${BRAND.city.toUpperCase()}`,
  hero_primary_button: 'Quero a Tabela do Atacado',
  hero_secondary_button: 'Montar Pedido',
  whatsapp_cta_text: 'Pedir Tabela',
  beneficios: 'Mais do que um produto saboroso, oferecemos uma parceria para alavancar suas vendas e fidelizar seus clientes.',
  sabores_destaque: 'Nossos Destaques',
  faq: 'Perguntas frequentes',
  textos_do_formulario_final: 'Preencha os dados e receba nossa tabela de atacado.',
};

const defaultSecurityConfig: SuperAdminSecurityConfig = {
  masterPassword: 'brownie123',
  adminEnabled: true,
  sessionDurationMinutes: 480,
  accessMode: 'master_password',
};

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
    return { arrayValue: { values: value.map((item) => toFirestoreValue(item)) } };
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

const requestFirestore = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao acessar Firestore');
  }

  return (await response.json()) as T;
};

const setDocument = async (docPath: string, payload: Record<string, unknown>) => {
  await requestFirestore(
    buildDocUrl(docPath),
    {
      method: 'PATCH',
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, toFirestoreValue(value)])),
      }),
    },
  );
};

const createDocument = async (collectionPath: string, payload: Record<string, unknown>, documentId?: string) => {
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
  );

  return doc.name.split('/').pop() || '';
};

const deleteDocument = async (docPath: string) => {
  await requestFirestore<Record<string, never>>(buildDocUrl(docPath), { method: 'DELETE' });
};

const listCollection = async <T,>(collectionPath: string) => {
  const response = await requestFirestore<{ documents?: { name: string; fields?: Record<string, FirestoreValue> }[] }>(
    buildCollectionUrl(collectionPath, 'pageSize=200'),
    { method: 'GET' },
  );

  return (response.documents || []).map((doc) => parseDocument<T>(doc));
};

const getDocument = async <T,>(docPath: string): Promise<T | null> => {
  try {
    const response = await requestFirestore<{ name: string; fields?: Record<string, FirestoreValue> }>(buildDocUrl(docPath), { method: 'GET' });
    return parseDocument<T>(response);
  } catch {
    return null;
  }
};

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

  const landing = await getLandingConfig();
  if (!landing) {
    await setDocument(`${baseStorePath}/configuracoes/paginasLanding`, {
      ...defaultLandingConfig,
      updatedAt: nowIso(),
    });
  }

  const security = await getSuperAdminSecurityConfig();
  if (!security) {
    await setDocument(`${baseStorePath}/configuracoes/segurancaAdmin`, {
      ...defaultSecurityConfig,
      updatedAt: nowIso(),
    });
  }
};

export const getSuperAdminSecurityConfig = async (): Promise<SuperAdminSecurityConfig | null> =>
  getDocument<SuperAdminSecurityConfig>(`${baseStorePath}/configuracoes/segurancaAdmin`);

export const saveSuperAdminSecurityConfig = async (config: SuperAdminSecurityConfig) => {
  await setDocument(`${baseStorePath}/configuracoes/segurancaAdmin`, { ...config, updatedAt: nowIso() });
};

export const getLandingConfig = async (): Promise<LandingConfig | null> =>
  getDocument<LandingConfig>(`${baseStorePath}/configuracoes/paginasLanding`);

export const saveLandingConfig = async (config: LandingConfig) => {
  await setDocument(`${baseStorePath}/configuracoes/paginasLanding`, { ...config, updatedAt: nowIso() });
};

export const getSettings = async (): Promise<Settings | null> => getDocument<Settings>(`${baseStorePath}/configuracoes/geral`);

export const saveSettings = async (payload: Settings) => {
  await setDocument(`${baseStorePath}/configuracoes/geral`, {
    ...payload,
    updatedAt: nowIso(),
  });
};

export const getFlavors = async () => {
  const flavors = await listCollection<Flavor>(`${baseStorePath}/sabores`);
  return flavors.sort((a, b) => a.sortOrder - b.sortOrder);
};

export const saveFlavor = async (flavor: Flavor) => {
  await setDocument(`${baseStorePath}/sabores/${flavor.id}`, { ...flavor, updatedAt: nowIso() });
};

export const createFlavor = async (payload: Flavor) => {
  await setDocument(`${baseStorePath}/sabores/${payload.id}`, payload);
};

export const deleteFlavor = async (id: string) => deleteDocument(`${baseStorePath}/sabores/${id}`);

export const getRegions = async () => listCollection<Region>(`${baseStorePath}/regioes`);

export const saveRegion = async (region: Region) => {
  await setDocument(`${baseStorePath}/regioes/${region.id}`, { ...region, updatedAt: nowIso() });
};

export const createRegion = async (region: Region) => {
  await setDocument(`${baseStorePath}/regioes/${region.id}`, region);
};

export const deleteRegion = async (id: string) => deleteDocument(`${baseStorePath}/regioes/${id}`);

export const getOrders = async () => {
  const orders = await listCollection<Order>(`${baseStorePath}/pedidos`);
  return orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const saveOrder = async (order: Order) => {
  await setDocument(`${baseStorePath}/pedidos/${order.id}`, { ...order, updatedAt: nowIso() });
};

export const deleteOrder = async (id: string) => deleteDocument(`${baseStorePath}/pedidos/${id}`);

export const getCustomers = async () => {
  const customers = await listCollection<Customer>(`${baseStorePath}/clientes`);
  return customers.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

export const saveCustomer = async (customer: Customer) => {
  await setDocument(`${baseStorePath}/clientes/${customer.id}`, { ...customer, updatedAt: nowIso() });
};

export const deleteCustomer = async (id: string) => deleteDocument(`${baseStorePath}/clientes/${id}`);

export const upsertCustomerByPhone = async (customer: Customer) => {
  await setDocument(`${baseStorePath}/clientes/${customer.id}`, customer);
};

export const createOrder = async (order: Omit<Order, 'id'>) => {
  const id = await createDocument(`${baseStorePath}/pedidos`, order);
  return { ...order, id };
};

export const formatDefaultTemplate = () => defaultWhatsappTemplate;
export const getDefaultLandingConfig = () => defaultLandingConfig;
export const getDefaultSecurityConfig = () => defaultSecurityConfig;
