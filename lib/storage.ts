import { BRAND, PRODUCTS } from '../constants';
import { Customer, Flavor, Order, OrderStatus, Region, Settings } from '../types';

const KEYS = {
  flavors: 'bb_flavors',
  orders: 'bb_orders',
  customers: 'bb_customers',
  regions: 'bb_regions',
  settings: 'bb_settings',
  auth: 'bb_admin_auth',
};

const defaultTemplate = `Olá! Quero fazer um pedido de atacado.\n\nNome: {nome}\nTelefone: {telefone}\nTipo de negócio: {tipoNegocio}\nBairro: {bairro}\nForma de entrega: {formaEntrega}\n\nPedido:\n{itensFormatados}\n\nTotal de unidades: {totalUnidades}\nSubtotal estimado: {subtotal}\n\nObservações: {observacoes}`;

const now = () => new Date().toISOString();

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export const ensureSeedData = () => {
  if (!localStorage.getItem(KEYS.flavors)) {
    const seeded: Flavor[] = PRODUCTS.map((product, index) => ({
      id: `flavor-${product.id}`,
      name: product.name,
      slug: slugify(product.name),
      description: product.description,
      imageUrl: product.image,
      priceWholesale: 7.5,
      active: true,
      featured: index < 4,
      sortOrder: index + 1,
      createdAt: now(),
      updatedAt: now(),
    }));
    write(KEYS.flavors, seeded);
  }

  if (!localStorage.getItem(KEYS.settings)) {
    const settings: Settings = {
      whatsappNumber: BRAND.whatsapp,
      minimumOrderUnits: 20,
      businessHours: BRAND.hours,
      defaultDeliveryFee: 0,
      whatsappTemplate: defaultTemplate,
      operationalMessage: 'Pedidos confirmados por WhatsApp durante horário comercial.',
      adminPassword: 'brownie123',
    };
    write(KEYS.settings, settings);
  }

  if (!localStorage.getItem(KEYS.orders)) write(KEYS.orders, [] as Order[]);
  if (!localStorage.getItem(KEYS.customers)) write(KEYS.customers, [] as Customer[]);
  if (!localStorage.getItem(KEYS.regions)) {
    const seededRegions: Region[] = [
      {
        id: crypto.randomUUID(),
        name: 'Salvador - Centro',
        active: true,
        deliveryFee: 0,
        estimatedTime: 'No mesmo dia',
        minimumOrderRegional: 20,
      },
    ];
    write(KEYS.regions, seededRegions);
  }
};

export const getFlavors = () => read<Flavor[]>(KEYS.flavors, []).sort((a, b) => a.sortOrder - b.sortOrder);
export const saveFlavors = (flavors: Flavor[]) => write(KEYS.flavors, flavors);

export const getOrders = () => read<Order[]>(KEYS.orders, []);
export const saveOrders = (orders: Order[]) => write(KEYS.orders, orders);

export const getCustomers = () => read<Customer[]>(KEYS.customers, []);
export const saveCustomers = (customers: Customer[]) => write(KEYS.customers, customers);

export const getRegions = () => read<Region[]>(KEYS.regions, []);
export const saveRegions = (regions: Region[]) => write(KEYS.regions, regions);

export const getSettings = () => read<Settings>(KEYS.settings, {
  whatsappNumber: BRAND.whatsapp,
  minimumOrderUnits: 20,
  businessHours: BRAND.hours,
  defaultDeliveryFee: 0,
  whatsappTemplate: defaultTemplate,
  operationalMessage: '',
  adminPassword: 'brownie123',
});
export const saveSettings = (settings: Settings) => write(KEYS.settings, settings);

const statusLabels: Record<OrderStatus, string> = {
  novo: 'Novo',
  aguardando_confirmacao: 'Aguardando confirmação',
  confirmado: 'Confirmado',
  em_producao: 'Em produção',
  pronto: 'Pronto',
  saiu_para_entrega: 'Saiu para entrega',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const ORDER_STATUSES = Object.keys(statusLabels) as OrderStatus[];
export const getStatusLabel = (status: OrderStatus) => statusLabels[status];

export const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

export const buildWhatsAppMessage = (template: string, order: Order) => {
  const itensFormatados = order.items.map((item) => `- ${item.flavorName}: ${item.quantity} un`).join('\n');
  return template
    .replace('{nome}', order.customerName)
    .replace('{telefone}', order.customerPhone)
    .replace('{tipoNegocio}', order.businessType || 'Não informado')
    .replace('{bairro}', order.neighborhood || 'Não informado')
    .replace('{formaEntrega}', order.deliveryType || 'Não informado')
    .replace('{itensFormatados}', itensFormatados)
    .replace('{totalUnidades}', String(order.totalUnits))
    .replace('{subtotal}', `R$ ${order.subtotalEstimated.toFixed(2)}`)
    .replace('{observacoes}', order.notes || 'Sem observações');
};

export const persistOrder = (payload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => {
  const orders = getOrders();
  const customers = getCustomers();
  const createdAt = now();

  const order: Order = {
    ...payload,
    id: crypto.randomUUID(),
    orderNumber: `BB-${String(orders.length + 1).padStart(4, '0')}`,
    createdAt,
    updatedAt: createdAt,
    statusHistory: [{ status: payload.status, timestamp: createdAt }],
  };

  saveOrders([order, ...orders]);

  const existing = customers.find((c) => c.phone === payload.customerPhone);
  if (existing) {
    existing.name = payload.customerName;
    existing.businessType = payload.businessType;
    existing.neighborhood = payload.neighborhood;
    existing.updatedAt = now();
    saveCustomers([...customers]);
  } else {
    saveCustomers([
      {
        id: crypto.randomUUID(),
        name: payload.customerName,
        phone: payload.customerPhone,
        businessType: payload.businessType,
        neighborhood: payload.neighborhood,
        notes: '',
        createdAt: createdAt,
        updatedAt: createdAt,
      },
      ...customers,
    ]);
  }

  return order;
};

export const setAdminAuth = (value: boolean) => localStorage.setItem(KEYS.auth, value ? '1' : '0');
export const isAdminAuthenticated = () => localStorage.getItem(KEYS.auth) === '1';
