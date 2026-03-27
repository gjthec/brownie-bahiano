import React, { useEffect, useMemo, useState } from 'react';
import Button from '../Button';
import { Customer, Flavor, Order, OrderStatus, Region, Settings } from '../../types';
import { buildWhatsAppMessage, getStatusLabel, ORDER_STATUSES } from '../../lib/storage';
import {
  createFlavor,
  createOrder,
  createRegion,
  deleteCustomer,
  deleteFlavor,
  deleteOrder,
  deleteRegion,
  formatDefaultTemplate,
  getCustomers,
  getDefaultLandingConfig,
  getDefaultSecurityConfig,
  getFlavors,
  getLandingConfig,
  getOrders,
  getRegions,
  getSettings,
  getSuperAdminSecurityConfig,
  LandingConfig,
  saveCustomer,
  saveFlavor,
  saveLandingConfig,
  saveOrder,
  saveRegion,
  saveSettings,
  saveSuperAdminSecurityConfig,
  SuperAdminSecurityConfig,
} from '../../lib/firestore';

const menu = ['Dashboard', 'Pedidos', 'Sabores', 'Clientes', 'Regioes', 'Landing', 'Configuracoes'] as const;
const ADMIN_SESSION_KEY = 'bb_super_admin_session';

const fallbackSettings: Settings = {
  whatsappNumber: '5571993059366',
  minimumOrderUnits: 20,
  businessHours: '',
  defaultDeliveryFee: 0,
  whatsappTemplate: formatDefaultTemplate(),
  updatedAt: new Date().toISOString(),
};

const statusBadgeStyles: Record<OrderStatus, string> = {
  novo: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
  aguardando_confirmacao: 'bg-yellow-500/20 text-yellow-100 border-yellow-400/40',
  confirmado: 'bg-blue-500/20 text-blue-100 border-blue-400/40',
  em_producao: 'bg-purple-500/20 text-purple-100 border-purple-400/40',
  pronto: 'bg-teal-500/20 text-teal-100 border-teal-400/40',
  saiu_para_entrega: 'bg-orange-500/20 text-orange-100 border-orange-400/40',
  concluido: 'bg-green-500/20 text-green-100 border-green-400/40',
  cancelado: 'bg-red-500/20 text-red-100 border-red-400/40',
};

const isSessionValid = () => {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { expiresAt: number };
    return Date.now() < parsed.expiresAt;
  } catch {
    return false;
  }
};

const setSession = (durationMinutes: number) => {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + durationMinutes * 60_000 }));
};

const clearSession = () => localStorage.removeItem(ADMIN_SESSION_KEY);

const AdminApp: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(isSessionValid());
  const [masterPassword, setMasterPassword] = useState('');
  const [security, setSecurity] = useState<SuperAdminSecurityConfig>(getDefaultSecurityConfig());

  const [tab, setTab] = useState<(typeof menu)[number]>('Dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<Settings>(fallbackSettings);
  const [landingConfig, setLandingConfig] = useState<LandingConfig>(getDefaultLandingConfig());

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'todos',
    period: 'todos',
    neighborhood: '',
    deliveryType: 'todos',
    query: '',
    sort: 'date_desc',
  });

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const [ordersData, flavorsData, customersData, regionsData, settingsData, landingData, securityData] = await Promise.all([
        getOrders(),
        getFlavors(),
        getCustomers(),
        getRegions(),
        getSettings(),
        getLandingConfig(),
        getSuperAdminSecurityConfig(),
      ]);

      setOrders(ordersData);
      setFlavors(flavorsData);
      setCustomers(customersData);
      setRegions(regionsData);
      if (settingsData) setSettings(settingsData);
      if (landingData) setLandingConfig(landingData);
      if (securityData) setSecurity(securityData);
    } catch {
      setError('Não foi possível carregar dados do Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const todayOrders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((order) => order.createdAt.startsWith(today));
  }, [orders]);

  const topFlavors = useMemo(() => {
    const counter = orders.flatMap((order) => order.items).reduce<Record<string, number>>((acc, item) => {
      acc[item.flavorName] = (acc[item.flavorName] || 0) + item.quantity;
      return acc;
    }, {});

    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name)
      .join(', ');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = filters.query.toLowerCase().trim();
    const now = new Date();

    const withinPeriod = (orderDate: string) => {
      if (filters.period === 'todos') return true;
      const diffMs = now.getTime() - new Date(orderDate).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (filters.period === 'hoje') return diffDays <= 1;
      if (filters.period === '7dias') return diffDays <= 7;
      if (filters.period === '30dias') return diffDays <= 30;
      return true;
    };

    let list = orders.filter((order) => {
      if (filters.status !== 'todos' && order.status !== filters.status) return false;
      if (filters.deliveryType !== 'todos' && order.deliveryType !== filters.deliveryType) return false;
      if (filters.neighborhood && !order.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
      if (!withinPeriod(order.createdAt)) return false;
      if (query && !`${order.customerName} ${order.customerPhone}`.toLowerCase().includes(query)) return false;
      return true;
    });

    if (filters.sort === 'date_asc') list = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (filters.sort === 'date_desc') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filters.sort === 'status') list = [...list].sort((a, b) => a.status.localeCompare(b.status));

    return list;
  }, [filters, orders]);

  const handleUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!security.adminEnabled) return setError('Acesso administrativo desabilitado em segurancaAdmin.');
    if (masterPassword !== security.masterPassword) return setError('Senha incorreta. Tente novamente.');

    setSession(security.sessionDurationMinutes || 480);
    setIsUnlocked(true);
    setMasterPassword('');
  };

  const handleLogout = () => {
    clearSession();
    setIsUnlocked(false);
    setTab('Dashboard');
  };

  const saveWithFeedback = async (action: () => Promise<void>, message: string) => {
    setSuccess(null);
    setError(null);
    try {
      await action();
      setSuccess(message);
    } catch {
      setError('Não foi possível salvar no Firestore.');
    }
  };

  const recalcOrder = (order: Order): Order => {
    const subtotalEstimated = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalEstimated = subtotalEstimated + (order.deliveryFee || 0);
    return { ...order, subtotalEstimated, totalUnits, totalEstimated, updatedAt: new Date().toISOString() };
  };

  const updateOrderInState = (updated: Order) => {
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
  };

  const persistOrder = async (updated: Order, message = 'Pedido atualizado.') => {
    const normalized = recalcOrder(updated);
    updateOrderInState(normalized);
    await saveWithFeedback(() => saveOrder(normalized), message);
  };

  const updateOrderStatus = async (order: Order, status: OrderStatus, note = '') => {
    const next: Order = {
      ...order,
      status,
      statusHistory: [...(order.statusHistory || []), { status, changedAt: new Date().toISOString(), note }],
      updatedAt: new Date().toISOString(),
    };

    await persistOrder(next, 'Status do pedido atualizado.');
  };

  const duplicateOrder = async (order: Order) => {
    const now = new Date().toISOString();
    const copy: Omit<Order, 'id'> = {
      ...order,
      orderNumber: `BB-COPY-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: 'novo',
      statusHistory: [{ status: 'novo', changedAt: now, note: 'Pedido duplicado no admin' }],
      createdAt: now,
      updatedAt: now,
    };

    await saveWithFeedback(async () => {
      await createOrder(copy);
      await loadAdminData();
    }, 'Pedido duplicado com sucesso.');
  };

  const handleOpenWhatsapp = (order: Order) => {
    const msg = order.whatsappMessage || buildWhatsAppMessage(settings.whatsappTemplate, order);
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const openOrderDetails = (orderId: string) => setSelectedOrderId(orderId);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-cream flex items-center justify-center px-4">
        <form onSubmit={handleUnlock} className="bg-brand-primary rounded-xl p-8 w-full max-w-md border border-white/10">
          <h1 className="font-serif text-3xl mb-2">Super Admin</h1>
          <p className="text-stone-400 mb-6">Acesso único por senha mestra.</p>
          <input value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} type="password" placeholder="Senha mestra" className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 mb-4" />
          {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
          <Button type="submit" fullWidth>Entrar</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-cream">
      <header className="border-b border-white/10 sticky top-0 bg-brand-dark/95 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl">Central Super Admin</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadAdminData}>Atualizar</Button>
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 grid lg:grid-cols-[220px_1fr] gap-6">
        <nav className="bg-brand-primary border border-white/10 rounded-xl p-3 h-fit">
          {menu.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${tab === item ? 'bg-brand-gold text-brand-dark font-bold' : 'hover:bg-white/5'}`}>{item}</button>
          ))}
        </nav>

        <section className="space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-sm">{error}</div>}
          {success && <div className="bg-green-900/40 border border-green-700 rounded-lg p-3 text-sm">{success}</div>}
          {loading && <div className="text-sm text-stone-300">Carregando dados...</div>}

          {tab === 'Dashboard' && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                ['Pedidos do dia', todayOrders.length],
                ['Pedidos em aberto', orders.filter((o) => !['concluido', 'cancelado'].includes(o.status)).length],
                ['Concluídos', orders.filter((o) => o.status === 'concluido').length],
                ['Cancelados', orders.filter((o) => o.status === 'cancelado').length],
                ['Ticket médio estimado', `R$ ${(orders.reduce((sum, item) => sum + item.totalEstimated, 0) / Math.max(orders.length, 1)).toFixed(2)}`],
                ['Sabores mais pedidos', topFlavors || 'Sem dados'],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-brand-primary border border-white/10 rounded-xl p-4">
                  <p className="text-stone-400 text-sm">{label}</p>
                  <p className="text-2xl font-bold mt-2 text-brand-gold">{String(value)}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'Pedidos' && (
            <>
              <div className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-6 gap-3">
                <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-2 py-2">
                  <option value="todos">Status: todos</option>
                  {ORDER_STATUSES.map((status) => <option key={status} value={status}>{getStatusLabel(status)}</option>)}
                </select>
                <select value={filters.period} onChange={(e) => setFilters((p) => ({ ...p, period: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-2 py-2">
                  <option value="todos">Período: todos</option><option value="hoje">Hoje</option><option value="7dias">Últimos 7 dias</option><option value="30dias">Últimos 30 dias</option>
                </select>
                <input value={filters.neighborhood} onChange={(e) => setFilters((p) => ({ ...p, neighborhood: e.target.value }))} placeholder="Bairro" className="bg-brand-dark border border-white/10 rounded px-2 py-2" />
                <select value={filters.deliveryType} onChange={(e) => setFilters((p) => ({ ...p, deliveryType: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-2 py-2"><option value="todos">Entrega: todas</option><option value="Entrega">Entrega</option><option value="Retirada">Retirada</option></select>
                <input value={filters.query} onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))} placeholder="Buscar cliente/telefone" className="bg-brand-dark border border-white/10 rounded px-2 py-2" />
                <select value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-2 py-2"><option value="date_desc">Data ↓</option><option value="date_asc">Data ↑</option><option value="status">Status</option></select>
              </div>

              <div className="bg-brand-primary border border-white/10 rounded-xl overflow-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-black/20">
                    <tr>{['Número', 'Cliente', 'Telefone', 'Negócio', 'Bairro', 'Itens', 'Subtotal', 'Status', 'Data', 'Ações'].map((head) => <th key={head} className="text-left px-3 py-3 text-stone-300">{head}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className={`border-t border-white/10 ${order.status === 'novo' ? 'bg-sky-900/10' : ''}`}>
                        <td className="px-3 py-3 font-semibold text-brand-gold">{order.orderNumber}</td>
                        <td className="px-3 py-3">{order.customerName}</td>
                        <td className="px-3 py-3">{order.customerPhone}</td>
                        <td className="px-3 py-3">{order.businessType || '-'}</td>
                        <td className="px-3 py-3">{order.neighborhood || '-'}</td>
                        <td className="px-3 py-3">{order.totalUnits}</td>
                        <td className="px-3 py-3">R$ {order.subtotalEstimated.toFixed(2)}</td>
                        <td className="px-3 py-3"><span className={`inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${statusBadgeStyles[order.status]}`}>{getStatusLabel(order.status)}</span></td>
                        <td className="px-3 py-3">{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-3 space-x-2 whitespace-nowrap">
                          <button onClick={() => openOrderDetails(order.id)} className="text-brand-gold hover:underline">Detalhes</button>
                          <button onClick={() => handleOpenWhatsapp(order)} className="text-brand-gold hover:underline">WhatsApp</button>
                          <button onClick={() => updateOrderStatus(order, 'concluido', 'Concluído rápido')} className="text-green-300 hover:underline">Concluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'Sabores' && (
            <div className="space-y-3">
              <Button onClick={async () => {
                const createdAt = new Date().toISOString();
                const newFlavor: Flavor = { id: crypto.randomUUID(), name: 'Novo sabor', slug: `novo-${flavors.length + 1}`, description: 'Descreva o sabor', imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop', priceWholesale: 7.5, active: true, featured: false, sortOrder: flavors.length + 1, createdAt, updatedAt: createdAt };
                setFlavors((prev) => [...prev, newFlavor]);
                await saveWithFeedback(() => createFlavor(newFlavor), 'Sabor criado.');
              }}>Adicionar sabor</Button>
              {flavors.map((flavor) => (
                <div key={flavor.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-5 gap-3">
                  <input value={flavor.name} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, name: e.target.value } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.description} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, description: e.target.value } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.imageUrl} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, imageUrl: e.target.value } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={flavor.priceWholesale} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, priceWholesale: Number(e.target.value) } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex gap-2 items-center"><button onClick={() => saveWithFeedback(() => saveFlavor(flavor), 'Sabor salvo.')} className="text-brand-gold hover:underline text-sm">Salvar</button><button onClick={() => saveWithFeedback(async () => { await deleteFlavor(flavor.id); await loadAdminData(); }, 'Sabor excluído.')} className="text-red-300 hover:underline text-sm">Excluir</button></div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Clientes' && (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div key={customer.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-5 gap-3">
                  <input value={customer.name} onChange={(e) => setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, name: e.target.value } : c)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={customer.phone} onChange={(e) => setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, phone: e.target.value } : c)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={customer.businessType || ''} onChange={(e) => setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, businessType: e.target.value } : c)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={customer.notes || ''} onChange={(e) => setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, notes: e.target.value } : c)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex gap-2 items-center"><button onClick={() => saveWithFeedback(() => saveCustomer(customer), 'Cliente salvo.')} className="text-brand-gold hover:underline text-sm">Salvar</button><button onClick={() => saveWithFeedback(async () => { await deleteCustomer(customer.id); await loadAdminData(); }, 'Cliente excluído.')} className="text-red-300 hover:underline text-sm">Excluir</button></div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Regioes' && (
            <div className="space-y-3">
              <Button onClick={async () => {
                const now = new Date().toISOString();
                const region: Region = { id: crypto.randomUUID(), name: 'Nova região', active: true, deliveryFee: settings.defaultDeliveryFee, estimatedTime: '24h', minimumOrderUnits: settings.minimumOrderUnits, createdAt: now, updatedAt: now };
                setRegions((prev) => [...prev, region]);
                await saveWithFeedback(() => createRegion(region), 'Região criada.');
              }}>Adicionar região</Button>
              {regions.map((region) => (
                <div key={region.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-5 gap-3">
                  <input value={region.name} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, name: e.target.value } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={region.deliveryFee} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, deliveryFee: Number(e.target.value) } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={region.estimatedTime} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, estimatedTime: e.target.value } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={region.minimumOrderUnits} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, minimumOrderUnits: Number(e.target.value) } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex gap-2 items-center"><button onClick={() => saveWithFeedback(() => saveRegion(region), 'Região salva.')} className="text-brand-gold hover:underline text-sm">Salvar</button><button onClick={() => saveWithFeedback(async () => { await deleteRegion(region.id); await loadAdminData(); }, 'Região excluída.')} className="text-red-300 hover:underline text-sm">Excluir</button></div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Landing' && (
            <div className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-2 gap-4">
              <input value={landingConfig.hero_badge} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_badge: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Hero badge" />
              <input value={landingConfig.hero_title} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_title: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Hero título" />
              <input value={landingConfig.hero_subtitle} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_subtitle: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2" placeholder="Hero subtítulo" />
              <Button onClick={() => saveWithFeedback(() => saveLandingConfig(landingConfig), 'Configuração da landing salva.')}>Salvar landing</Button>
            </div>
          )}

          {tab === 'Configuracoes' && (
            <div className="space-y-4">
              <div className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-2 gap-4">
                <input value={settings.whatsappNumber} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Número WhatsApp" />
                <input type="number" value={settings.minimumOrderUnits} onChange={(e) => setSettings((prev) => ({ ...prev, minimumOrderUnits: Number(e.target.value) }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Pedido mínimo" />
                <input value={settings.businessHours} onChange={(e) => setSettings((prev) => ({ ...prev, businessHours: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2" placeholder="Horário" />
                <textarea value={settings.whatsappTemplate} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappTemplate: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2 min-h-32" />
                <Button onClick={() => saveWithFeedback(() => saveSettings(settings), 'Configurações gerais salvas.')}>Salvar configurações gerais</Button>
              </div>

              <div className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-2 gap-4">
                <input type="password" value={security.masterPassword} onChange={(e) => setSecurity((prev) => ({ ...prev, masterPassword: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Senha mestra" />
                <input type="number" value={security.sessionDurationMinutes} onChange={(e) => setSecurity((prev) => ({ ...prev, sessionDurationMinutes: Number(e.target.value) }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Duração sessão (min)" />
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={security.adminEnabled} onChange={(e) => setSecurity((prev) => ({ ...prev, adminEnabled: e.target.checked }))} /> Admin habilitado</label>
                <Button onClick={() => saveWithFeedback(() => saveSuperAdminSecurityConfig(security), 'Segurança do Super Admin salva.')}>Salvar segurança</Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="w-full max-w-3xl h-full overflow-y-auto bg-brand-primary border-l border-white/10 p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-widest text-brand-gold">Detalhes do pedido</p>
                <h3 className="font-serif text-3xl">{selectedOrder.orderNumber}</h3>
                <p className="text-sm text-stone-400">ID: {selectedOrder.id}</p>
              </div>
              <button className="text-stone-300 hover:text-brand-gold" onClick={() => setSelectedOrderId(null)}>Fechar</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-brand-dark/60 border border-white/10 rounded-lg p-4">
                <p className="text-stone-400">Status atual</p>
                <span className={`inline-flex mt-2 px-2 py-1 rounded-full border text-xs font-semibold ${statusBadgeStyles[selectedOrder.status]}`}>{getStatusLabel(selectedOrder.status)}</span>
                <select className="mt-3 w-full bg-brand-dark border border-white/10 rounded px-2 py-2" value={selectedOrder.status} onChange={(e) => updateOrderStatus(selectedOrder, e.target.value as OrderStatus, 'Mudança pelo detalhe')}>
                  {ORDER_STATUSES.map((status) => <option key={status} value={status}>{getStatusLabel(status)}</option>)}
                </select>
                <p className="mt-2 text-xs text-stone-400">Origem: {selectedOrder.source}</p>
              </div>

              <div className="bg-brand-dark/60 border border-white/10 rounded-lg p-4">
                <p className="text-stone-400">Resumo financeiro</p>
                <p>Subtotal: R$ {selectedOrder.subtotalEstimated.toFixed(2)}</p>
                <p>Taxa de entrega: R$ {(selectedOrder.deliveryFee || 0).toFixed(2)}</p>
                <p className="font-semibold text-brand-gold">Total estimado: R$ {selectedOrder.totalEstimated.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-brand-dark/60 border border-white/10 rounded-lg p-4 grid md:grid-cols-2 gap-3">
              <h4 className="md:col-span-2 font-semibold text-brand-gold">Dados do cliente</h4>
              <input className="bg-brand-dark border border-white/10 rounded px-2 py-2" value={selectedOrder.customerName} onChange={(e) => updateOrderInState({ ...selectedOrder, customerName: e.target.value })} />
              <input className="bg-brand-dark border border-white/10 rounded px-2 py-2" value={selectedOrder.customerPhone} onChange={(e) => updateOrderInState({ ...selectedOrder, customerPhone: e.target.value })} />
              <input className="bg-brand-dark border border-white/10 rounded px-2 py-2" value={selectedOrder.businessType} onChange={(e) => updateOrderInState({ ...selectedOrder, businessType: e.target.value })} />
              <input className="bg-brand-dark border border-white/10 rounded px-2 py-2" value={selectedOrder.neighborhood} onChange={(e) => updateOrderInState({ ...selectedOrder, neighborhood: e.target.value })} />
              <input className="bg-brand-dark border border-white/10 rounded px-2 py-2" value={selectedOrder.deliveryType} onChange={(e) => updateOrderInState({ ...selectedOrder, deliveryType: e.target.value })} />
              <textarea className="bg-brand-dark border border-white/10 rounded px-2 py-2" value={selectedOrder.notes} onChange={(e) => updateOrderInState({ ...selectedOrder, notes: e.target.value })} />
            </div>

            <div className="bg-brand-dark/60 border border-white/10 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-brand-gold">Itens do pedido</h4>
              {selectedOrder.items.map((item, index) => (
                <div key={`${item.flavorId}-${index}`} className="grid grid-cols-[64px_1fr_100px_120px_120px] gap-3 items-center">
                  <img src={item.imageUrl} alt={item.flavorName} className="w-16 h-16 rounded-lg object-cover" />
                  <span>{item.flavorName}</span>
                  <input type="number" className="bg-brand-dark border border-white/10 rounded px-2 py-2" value={item.quantity} onChange={(e) => {
                    const qty = Number(e.target.value);
                    const nextItems = selectedOrder.items.map((entry, i) => i === index ? { ...entry, quantity: qty, lineTotal: qty * entry.unitPrice } : entry);
                    updateOrderInState(recalcOrder({ ...selectedOrder, items: nextItems }));
                  }} />
                  <span>R$ {item.unitPrice.toFixed(2)}</span>
                  <span>R$ {item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="bg-brand-dark/60 border border-white/10 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-brand-gold">Histórico do pedido</h4>
              {(selectedOrder.statusHistory || []).length === 0 ? <p className="text-sm text-stone-400">Sem histórico.</p> : (
                <div className="space-y-2">
                  {selectedOrder.statusHistory.map((event, idx) => (
                    <div key={`${event.changedAt}-${idx}`} className="text-sm border-l-2 border-brand-gold/60 pl-3">
                      <p className="font-semibold">{getStatusLabel(event.status)}</p>
                      <p className="text-stone-400">{new Date(event.changedAt).toLocaleString('pt-BR')}</p>
                      {event.note ? <p className="text-stone-300">{event.note}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-brand-dark/60 border border-white/10 rounded-lg p-4">
              <h4 className="font-semibold text-brand-gold mb-2">Notas internas do admin</h4>
              <textarea className="w-full bg-brand-dark border border-white/10 rounded px-2 py-2 min-h-24" value={selectedOrder.internalNotes || ''} onChange={(e) => updateOrderInState({ ...selectedOrder, internalNotes: e.target.value })} />
            </div>

            <div className="bg-brand-dark/60 border border-white/10 rounded-lg p-4">
              <h4 className="font-semibold text-brand-gold mb-2">Mensagem enviada para WhatsApp</h4>
              <textarea className="w-full bg-brand-dark border border-white/10 rounded px-2 py-2 min-h-24" value={selectedOrder.whatsappMessage || ''} onChange={(e) => updateOrderInState({ ...selectedOrder, whatsappMessage: e.target.value })} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => persistOrder(selectedOrder, 'Pedido salvo com sucesso.')}>Salvar alterações</Button>
              <Button variant="secondary" onClick={() => duplicateOrder(selectedOrder)}>Duplicar pedido</Button>
              <Button variant="outline" onClick={() => updateOrderStatus(selectedOrder, 'concluido', 'Concluído pelo detalhe')}>Concluir</Button>
              <Button variant="outline" onClick={() => updateOrderStatus(selectedOrder, 'cancelado', 'Cancelado pelo detalhe')}>Cancelar</Button>
              <Button variant="whatsapp" onClick={() => handleOpenWhatsapp(selectedOrder)}>Abrir WhatsApp</Button>
              <Button variant="secondary" onClick={() => saveWithFeedback(async () => { await deleteOrder(selectedOrder.id); setSelectedOrderId(null); await loadAdminData(); }, 'Pedido excluído.')}>Excluir pedido</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApp;
