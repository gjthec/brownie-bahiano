import React, { useMemo, useState } from 'react';
import Button from '../Button';
import {
  ORDER_STATUSES,
  buildWhatsAppMessage,
  getCustomers,
  getFlavors,
  getOrders,
  getRegions,
  getSettings,
  getStatusLabel,
  isAdminAuthenticated,
  saveFlavors,
  saveOrders,
  saveRegions,
  saveSettings,
  setAdminAuth,
} from '../../lib/storage';
import { Flavor, Order, OrderStatus, Region, Settings } from '../../types';

const menu = ['Dashboard', 'Pedidos', 'Sabores', 'Clientes', 'Regioes e Entrega', 'Configuracoes'] as const;

const AdminApp: React.FC = () => {
  const [isAuth, setIsAuth] = useState(isAdminAuthenticated());
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [tab, setTab] = useState<(typeof menu)[number]>('Dashboard');
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [flavors, setFlavors] = useState<Flavor[]>(getFlavors());
  const [regions, setRegions] = useState<Region[]>(getRegions());
  const customers = getCustomers();

  const todayOrders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((order) => order.createdAt.startsWith(today));
  }, [orders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === settings.adminPassword) {
      setAdminAuth(true);
      setIsAuth(true);
    } else {
      alert('Senha inválida.');
    }
  };

  const setOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status,
            updatedAt: new Date().toISOString(),
            statusHistory: [...order.statusHistory, { status, timestamp: new Date().toISOString() }],
          }
        : order,
    );
    setOrders(updated);
    saveOrders(updated);
  };

  const openWhatsApp = (order: Order) => {
    const message = buildWhatsAppMessage(settings.whatsappTemplate, order);
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const saveFlavorField = (id: string, key: keyof Flavor, value: string | number | boolean) => {
    const updated = flavors.map((flavor) =>
      flavor.id === id ? { ...flavor, [key]: value, updatedAt: new Date().toISOString() } : flavor,
    );
    setFlavors(updated);
    saveFlavors(updated);
  };

  const addFlavor = () => {
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
    const updated = [...flavors, newFlavor];
    setFlavors(updated);
    saveFlavors(updated);
  };

  const addRegion = () => {
    const updated = [
      ...regions,
      {
        id: crypto.randomUUID(),
        name: 'Nova região',
        active: true,
        deliveryFee: settings.defaultDeliveryFee,
        estimatedTime: '24h',
      },
    ];
    setRegions(updated);
    saveRegions(updated);
  };

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-cream flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-brand-primary rounded-xl p-8 w-full max-w-md border border-white/10">
          <h1 className="font-serif text-3xl mb-2">Admin Brownie Baiano</h1>
          <p className="text-stone-400 mb-6">Acesso restrito. Faça login para gerenciar operação.</p>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Senha"
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 mb-4"
          />
          <Button type="submit" fullWidth>
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-cream">
      <header className="border-b border-white/10 sticky top-0 bg-brand-dark/95 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl">Painel Admin</h1>
          <Button
            variant="outline"
            onClick={() => {
              setAdminAuth(false);
              setIsAuth(false);
            }}
          >
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 grid lg:grid-cols-[220px_1fr] gap-6">
        <nav className="bg-brand-primary border border-white/10 rounded-xl p-3 h-fit">
          {menu.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${tab === item ? 'bg-brand-gold text-brand-dark font-bold' : 'hover:bg-white/5'}`}
            >
              {item}
            </button>
          ))}
        </nav>

        <section>
          {tab === 'Dashboard' && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                ['Pedidos do dia', todayOrders.length],
                ['Pedidos em aberto', orders.filter((o) => !['concluido', 'cancelado'].includes(o.status)).length],
                ['Concluídos', orders.filter((o) => o.status === 'concluido').length],
                ['Cancelados', orders.filter((o) => o.status === 'cancelado').length],
                ['Ticket médio estimado', `R$ ${(orders.reduce((s, o) => s + o.subtotalEstimated, 0) / Math.max(orders.length, 1)).toFixed(2)}`],
                ['Sabores mais pedidos',
                  orders
                    .flatMap((o) => o.items)
                    .reduce<Record<string, number>>((acc, item) => {
                      acc[item.flavorName] = (acc[item.flavorName] || 0) + item.quantity;
                      return acc;
                    }, {})
                    ? Object.entries(
                        orders
                          .flatMap((o) => o.items)
                          .reduce<Record<string, number>>((acc, item) => {
                            acc[item.flavorName] = (acc[item.flavorName] || 0) + item.quantity;
                            return acc;
                          }, {}),
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([name]) => name)
                        .join(', ') || 'Sem dados'
                    : 'Sem dados'],
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
                    <tr key={order.id} className="border-t border-white/10 align-top">
                      <td className="px-3 py-3">{order.orderNumber}</td>
                      <td className="px-3 py-3">{order.customerName}</td>
                      <td className="px-3 py-3">{order.customerPhone}</td>
                      <td className="px-3 py-3">{order.neighborhood || '-'}</td>
                      <td className="px-3 py-3">{order.totalUnits}</td>
                      <td className="px-3 py-3">R$ {order.subtotalEstimated.toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <select value={order.status} onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)} className="bg-brand-dark border border-white/10 rounded px-2 py-1">
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>{getStatusLabel(status)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => openWhatsApp(order)} className="text-brand-gold hover:underline">Abrir WhatsApp</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Sabores' && (
            <div className="space-y-3">
              <Button onClick={addFlavor}>Adicionar sabor</Button>
              {flavors.map((flavor) => (
                <div key={flavor.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-4 gap-3">
                  <input value={flavor.name} onChange={(e) => saveFlavorField(flavor.id, 'name', e.target.value)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.description} onChange={(e) => saveFlavorField(flavor.id, 'description', e.target.value)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={flavor.imageUrl} onChange={(e) => saveFlavorField(flavor.id, 'imageUrl', e.target.value)} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <div className="flex gap-2">
                    <input type="number" value={flavor.priceWholesale} onChange={(e) => saveFlavorField(flavor.id, 'priceWholesale', Number(e.target.value))} className="bg-brand-dark border border-white/10 rounded px-2 py-1 w-24" />
                    <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={flavor.active} onChange={(e) => saveFlavorField(flavor.id, 'active', e.target.checked)} /> Ativo</label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Clientes' && (
            <div className="bg-brand-primary border border-white/10 rounded-xl overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/20">
                  <tr>{['Nome', 'Telefone', 'Tipo', 'Bairro'].map((head) => <th key={head} className="text-left px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-white/10">
                      <td className="px-3 py-3">{customer.name}</td>
                      <td className="px-3 py-3">{customer.phone}</td>
                      <td className="px-3 py-3">{customer.businessType || '-'}</td>
                      <td className="px-3 py-3">{customer.neighborhood || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Regioes e Entrega' && (
            <div className="space-y-3">
              <Button onClick={addRegion}>Adicionar região</Button>
              {regions.map((region) => (
                <div key={region.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-4 gap-3">
                  <input value={region.name} onChange={(e) => {
                    const updated = regions.map((r) => (r.id === region.id ? { ...r, name: e.target.value } : r));
                    setRegions(updated); saveRegions(updated);
                  }} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input type="number" value={region.deliveryFee} onChange={(e) => {
                    const updated = regions.map((r) => (r.id === region.id ? { ...r, deliveryFee: Number(e.target.value) } : r));
                    setRegions(updated); saveRegions(updated);
                  }} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <input value={region.estimatedTime} onChange={(e) => {
                    const updated = regions.map((r) => (r.id === region.id ? { ...r, estimatedTime: e.target.value } : r));
                    setRegions(updated); saveRegions(updated);
                  }} className="bg-brand-dark border border-white/10 rounded px-2 py-1" />
                  <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={region.active} onChange={(e) => {
                    const updated = regions.map((r) => (r.id === region.id ? { ...r, active: e.target.checked } : r));
                    setRegions(updated); saveRegions(updated);
                  }} /> Ativa</label>
                </div>
              ))}
            </div>
          )}

          {tab === 'Configuracoes' && (
            <div className="bg-brand-primary border border-white/10 rounded-xl p-4 grid md:grid-cols-2 gap-4">
              <input value={settings.whatsappNumber} onChange={(e) => updateSettings({ ...settings, whatsappNumber: e.target.value })} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Número WhatsApp" />
              <input type="number" value={settings.minimumOrderUnits} onChange={(e) => updateSettings({ ...settings, minimumOrderUnits: Number(e.target.value) })} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Pedido mínimo" />
              <input value={settings.businessHours} onChange={(e) => updateSettings({ ...settings, businessHours: e.target.value })} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2" placeholder="Horário" />
              <textarea value={settings.whatsappTemplate} onChange={(e) => updateSettings({ ...settings, whatsappTemplate: e.target.value })} className="bg-brand-dark border border-white/10 rounded px-3 py-2 md:col-span-2 min-h-40" />
              <input type="password" value={settings.adminPassword} onChange={(e) => updateSettings({ ...settings, adminPassword: e.target.value })} className="bg-brand-dark border border-white/10 rounded px-3 py-2" placeholder="Senha admin" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminApp;
