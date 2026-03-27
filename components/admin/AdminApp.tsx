import React, { useEffect, useMemo, useState } from 'react';
import Button from '../Button';
import { Customer, Flavor, Order, OrderStatus, Region, Settings } from '../../types';
import { buildWhatsAppMessage, getStatusLabel, ORDER_STATUSES } from '../../lib/storage';
import {
  createFlavor,
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
  saveCustomer,
  saveFlavor,
  saveLandingConfig,
  saveOrder,
  saveRegion,
  saveSettings,
  saveSuperAdminSecurityConfig,
  SuperAdminSecurityConfig,
  LandingConfig,
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

  const handleUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!security.adminEnabled) {
      setError('Acesso administrativo desabilitado em segurancaAdmin.');
      return;
    }

    if (masterPassword !== security.masterPassword) {
      setError('Senha incorreta. Tente novamente.');
      return;
    }

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

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    const updated: Order = { ...order, status, updatedAt: new Date().toISOString() };
    setOrders((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    await saveWithFeedback(() => saveOrder(updated), 'Status do pedido atualizado.');
  };

  const handleOpenWhatsapp = (order: Order) => {
    const msg = order.whatsappMessage || buildWhatsAppMessage(settings.whatsappTemplate, order);
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddFlavor = async () => {
    const createdAt = new Date().toISOString();
    const newFlavor: Flavor = {
      id: crypto.randomUUID(),
      name: 'Novo sabor',
      slug: `novo-sabor-${flavors.length + 1}`,
      description: 'Descreva o sabor',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop',
      priceWholesale: 7.5,
      active: true,
      featured: false,
      sortOrder: flavors.length + 1,
      createdAt,
      updatedAt: createdAt,
    };

    setFlavors((prev) => [...prev, newFlavor]);
    await saveWithFeedback(() => createFlavor(newFlavor), 'Sabor criado com sucesso.');
  };

  const handleAddRegion = async () => {
    const now = new Date().toISOString();
    const region: Region = {
      id: crypto.randomUUID(),
      name: 'Nova região',
      active: true,
      deliveryFee: settings.defaultDeliveryFee,
      estimatedTime: '24h',
      minimumOrderUnits: settings.minimumOrderUnits,
      createdAt: now,
      updatedAt: now,
    };

    setRegions((prev) => [...prev, region]);
    await saveWithFeedback(() => createRegion(region), 'Região criada com sucesso.');
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-cream flex items-center justify-center px-4">
        <form onSubmit={handleUnlock} className="bg-brand-primary rounded-xl p-8 w-full max-w-md border border-white/10">
          <h1 className="font-serif text-3xl mb-2">Super Admin</h1>
          <p className="text-stone-400 mb-6">Acesso único por senha mestra.</p>
          <input
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            type="password"
            placeholder="Senha mestra"
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 mb-4"
          />
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
            <button key={item} onClick={() => setTab(item)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${tab === item ? 'bg-brand-gold text-brand-dark font-bold' : 'hover:bg-white/5'}`}>
              {item}
            </button>
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
                ['Ticket médio estimado', `R$ ${(orders.reduce((sum, item) => sum + item.subtotalEstimated, 0) / Math.max(orders.length, 1)).toFixed(2)}`],
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
            <div className="bg-brand-primary border border-white/10 rounded-xl overflow-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-black/20">
                  <tr>
                    {['Pedido', 'Cliente', 'Telefone', 'Negócio', 'Bairro', 'Entrega', 'Itens', 'Subtotal', 'Status', 'Criado em', 'Ações'].map((head) => (
                      <th key={head} className="text-left px-3 py-3 text-stone-300">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-white/10">
                      <td className="px-3 py-3">{order.orderNumber}</td>
                      <td className="px-3 py-3"><input className="bg-brand-dark border border-white/10 rounded px-2 py-1" value={order.customerName} onChange={(e) => setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, customerName: e.target.value } : o)))} onBlur={() => saveWithFeedback(() => saveOrder(order), 'Pedido atualizado.')} /></td>
                      <td className="px-3 py-3">{order.customerPhone}</td>
                      <td className="px-3 py-3">{order.businessType || '-'}</td>
                      <td className="px-3 py-3">{order.neighborhood || '-'}</td>
                      <td className="px-3 py-3">{order.deliveryType || '-'}</td>
                      <td className="px-3 py-3">{order.totalUnits}</td>
                      <td className="px-3 py-3">R$ {order.subtotalEstimated.toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <select value={order.status} onChange={(e) => updateOrderStatus(order, e.target.value as OrderStatus)} className="bg-brand-dark border border-white/10 rounded px-2 py-1">
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>{getStatusLabel(status)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-3 space-x-2">
                        <button onClick={() => handleOpenWhatsapp(order)} className="text-brand-gold hover:underline">WhatsApp</button>
                        <button onClick={() => saveWithFeedback(() => deleteOrder(order.id), 'Pedido excluído.') .then(loadAdminData)} className="text-red-300 hover:underline">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Sabores' && (
            <div className="space-y-3">
              <Button onClick={handleAddFlavor}>Adicionar sabor</Button>
              {flavors.map((flavor) => (
                <div key={flavor.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-5 gap-3">
                  <input value={flavor.name} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, name: e.target.value } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.description} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, description: e.target.value } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.imageUrl} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, imageUrl: e.target.value } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={flavor.priceWholesale} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, priceWholesale: Number(e.target.value) } : f)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={flavor.active} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, active: e.target.checked } : f)))} /> Ativo</label>
                    <button onClick={() => saveWithFeedback(() => saveFlavor(flavor), 'Sabor salvo.')} className="text-brand-gold hover:underline text-sm">Salvar</button>
                    <button onClick={() => saveWithFeedback(() => deleteFlavor(flavor.id), 'Sabor excluído.').then(loadAdminData)} className="text-red-300 hover:underline text-sm">Excluir</button>
                  </div>
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
                  <input value={customer.neighborhood || ''} onChange={(e) => setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, neighborhood: e.target.value } : c)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex items-center gap-3">
                    <button onClick={() => saveWithFeedback(() => saveCustomer(customer), 'Cliente salvo.')} className="text-brand-gold hover:underline text-sm">Salvar</button>
                    <button onClick={() => saveWithFeedback(() => deleteCustomer(customer.id), 'Cliente excluído.').then(loadAdminData)} className="text-red-300 hover:underline text-sm">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Regioes' && (
            <div className="space-y-3">
              <Button onClick={handleAddRegion}>Adicionar região</Button>
              {regions.map((region) => (
                <div key={region.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-5 gap-3">
                  <input value={region.name} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, name: e.target.value } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={region.deliveryFee} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, deliveryFee: Number(e.target.value) } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={region.estimatedTime} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, estimatedTime: e.target.value } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={region.minimumOrderUnits} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, minimumOrderUnits: Number(e.target.value) } : r)))} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={region.active} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, active: e.target.checked } : r)))} /> Ativa</label>
                    <button onClick={() => saveWithFeedback(() => saveRegion(region), 'Região salva.')} className="text-brand-gold hover:underline text-sm">Salvar</button>
                    <button onClick={() => saveWithFeedback(() => deleteRegion(region.id), 'Região excluída.').then(loadAdminData)} className="text-red-300 hover:underline text-sm">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Landing' && (
            <div className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-2 gap-4">
              <input value={landingConfig.hero_badge} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_badge: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Hero badge" />
              <input value={landingConfig.hero_title} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_title: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Hero título" />
              <input value={landingConfig.hero_subtitle} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_subtitle: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2" placeholder="Hero subtítulo" />
              <input value={landingConfig.hero_primary_button} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_primary_button: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Botão principal" />
              <input value={landingConfig.hero_secondary_button} onChange={(e) => setLandingConfig((prev) => ({ ...prev, hero_secondary_button: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Botão secundário" />
              <textarea value={landingConfig.textos_do_formulario_final} onChange={(e) => setLandingConfig((prev) => ({ ...prev, textos_do_formulario_final: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2 min-h-28" placeholder="Texto formulário final" />
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
    </div>
  );
};

export default AdminApp;
