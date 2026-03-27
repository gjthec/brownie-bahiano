import React, { useEffect, useMemo, useState } from 'react';
import Button from '../Button';
import { Customer, Flavor, Order, OrderStatus, Region, Settings } from '../../types';
import { buildWhatsAppMessage, getStatusLabel, ORDER_STATUSES } from '../../lib/storage';
import {
  createFlavor,
  createRegion,
  formatDefaultTemplate,
  getCustomers,
  getFlavors,
  getOrders,
  getRegions,
  getSettings,
  saveFlavor,
  saveOrder,
  saveRegion,
  saveSettings,
} from '../../lib/firestore';
import { getStoredSession, signInAdmin, signOutAdmin } from '../../lib/auth';

const menu = ['Dashboard', 'Pedidos', 'Sabores', 'Clientes', 'Regioes', 'Configuracoes'] as const;

const fallbackSettings: Settings = {
  whatsappNumber: '5571993059366',
  minimumOrderUnits: 20,
  businessHours: '',
  defaultDeliveryFee: 0,
  whatsappTemplate: formatDefaultTemplate(),
  updatedAt: new Date().toISOString(),
};

const AdminApp: React.FC = () => {
  const [session, setSession] = useState(getStoredSession());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<(typeof menu)[number]>('Dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<Settings>(fallbackSettings);

  const loadAdminData = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [ordersData, flavorsData, customersData, regionsData, settingsData] = await Promise.all([
        getOrders(),
        getFlavors(),
        getCustomers(),
        getRegions(),
        getSettings(),
      ]);
      setOrders(ordersData);
      setFlavors(flavorsData);
      setCustomers(customersData);
      setRegions(regionsData);
      if (settingsData) setSettings(settingsData);
    } catch {
      setError('Não foi possível carregar dados do Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [session]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const auth = await signInAdmin(email, password);
      setSession(auth);
      setPassword('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Falha no login.');
    }
  };

  const handleLogout = () => {
    signOutAdmin();
    setSession(null);
    setOrders([]);
    setFlavors([]);
    setCustomers([]);
    setRegions([]);
  };

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    if (!session) return;
    const updated: Order = { ...order, status, updatedAt: new Date().toISOString() };
    await saveOrder(updated, session.idToken);
    setOrders((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
  };

  const handleOpenWhatsapp = (order: Order) => {
    const msg = order.whatsappMessage || buildWhatsAppMessage(settings.whatsappTemplate, order);
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSaveFlavor = async (flavor: Flavor) => {
    if (!session) return;
    await saveFlavor({ ...flavor, updatedAt: new Date().toISOString() }, session.idToken);
  };

  const handleAddFlavor = async () => {
    if (!session) return;
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

    await createFlavor(newFlavor, session.idToken);
    setFlavors((prev) => [...prev, newFlavor]);
  };

  const handleSaveRegion = async (region: Region) => {
    if (!session) return;
    await saveRegion({ ...region, updatedAt: new Date().toISOString() }, session.idToken);
  };

  const handleAddRegion = async () => {
    if (!session) return;
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

    await createRegion(region, session.idToken);
    setRegions((prev) => [...prev, region]);
  };

  const handleSaveSettings = async () => {
    if (!session) return;
    await saveSettings({ ...settings, updatedAt: new Date().toISOString() }, session.idToken);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-cream flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-brand-primary rounded-xl p-8 w-full max-w-md border border-white/10">
          <h1 className="font-serif text-3xl mb-2">Admin Brownie Baiano</h1>
          <p className="text-stone-400 mb-6">Login com Firebase Auth (usuário autorizado em adminUsers).</p>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 mb-3" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 mb-4" />
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
          <h1 className="font-serif text-2xl">Painel Admin</h1>
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
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-black/20">
                  <tr>
                    {['Pedido', 'Cliente', 'Telefone', 'Bairro', 'Itens', 'Subtotal', 'Status', 'Criado em', 'Ações'].map((head) => (
                      <th key={head} className="text-left px-3 py-3 text-stone-300">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-white/10">
                      <td className="px-3 py-3">{order.orderNumber}</td>
                      <td className="px-3 py-3">{order.customerName}</td>
                      <td className="px-3 py-3">{order.customerPhone}</td>
                      <td className="px-3 py-3">{order.neighborhood || '-'}</td>
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
                      <td className="px-3 py-3"><button onClick={() => handleOpenWhatsapp(order)} className="text-brand-gold hover:underline">Abrir WhatsApp</button></td>
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
                <div key={flavor.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-4 gap-3">
                  <input value={flavor.name} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, name: e.target.value } : f)))} onBlur={() => handleSaveFlavor(flavor)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.description} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, description: e.target.value } : f)))} onBlur={() => handleSaveFlavor(flavor)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.imageUrl} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, imageUrl: e.target.value } : f)))} onBlur={() => handleSaveFlavor(flavor)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex gap-2">
                    <input type="number" value={flavor.priceWholesale} onChange={(e) => setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? { ...f, priceWholesale: Number(e.target.value) } : f)))} onBlur={() => handleSaveFlavor(flavor)} className="bg-brand-dark border border-white/10 rounded px-2 py-1 w-24" />
                    <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={flavor.active} onChange={(e) => {
                      const next = { ...flavor, active: e.target.checked };
                      setFlavors((prev) => prev.map((f) => (f.id === flavor.id ? next : f)));
                      handleSaveFlavor(next);
                    }} /> Ativo</label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Clientes' && (
            <div className="bg-brand-primary border border-white/10 rounded-xl overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/20">
                  <tr>{['Nome', 'Telefone', 'Tipo', 'Bairro', 'Último pedido'].map((head) => <th key={head} className="text-left px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-white/10">
                      <td className="px-3 py-3">{customer.name}</td>
                      <td className="px-3 py-3">{customer.phone}</td>
                      <td className="px-3 py-3">{customer.businessType || '-'}</td>
                      <td className="px-3 py-3">{customer.neighborhood || '-'}</td>
                      <td className="px-3 py-3">{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleString('pt-BR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Regioes' && (
            <div className="space-y-3">
              <Button onClick={handleAddRegion}>Adicionar região</Button>
              {regions.map((region) => (
                <div key={region.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-4 gap-3">
                  <input value={region.name} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, name: e.target.value } : r)))} onBlur={() => handleSaveRegion(region)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={region.deliveryFee} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, deliveryFee: Number(e.target.value) } : r)))} onBlur={() => handleSaveRegion(region)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={region.estimatedTime} onChange={(e) => setRegions((prev) => prev.map((r) => (r.id === region.id ? { ...r, estimatedTime: e.target.value } : r)))} onBlur={() => handleSaveRegion(region)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={region.active} onChange={(e) => {
                    const next = { ...region, active: e.target.checked };
                    setRegions((prev) => prev.map((r) => (r.id === region.id ? next : r)));
                    handleSaveRegion(next);
                  }} /> Ativa</label>
                </div>
              ))}
            </div>
          )}

          {tab === 'Configuracoes' && (
            <div className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-2 gap-4">
              <input value={settings.whatsappNumber} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Número WhatsApp" />
              <input type="number" value={settings.minimumOrderUnits} onChange={(e) => setSettings((prev) => ({ ...prev, minimumOrderUnits: Number(e.target.value) }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Pedido mínimo" />
              <input value={settings.businessHours} onChange={(e) => setSettings((prev) => ({ ...prev, businessHours: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2" placeholder="Horário" />
              <textarea value={settings.whatsappTemplate} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappTemplate: e.target.value }))} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2 min-h-40" />
              <Button onClick={handleSaveSettings}>Salvar configurações</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminApp;
