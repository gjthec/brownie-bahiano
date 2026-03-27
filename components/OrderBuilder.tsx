import React, { useEffect, useMemo, useState } from 'react';
import { CircleAlert, MessageCircle, Minus, Plus } from 'lucide-react';
import Section from './Section';
import Button from './Button';
import { Flavor, Settings } from '../types';
import { buildWhatsAppMessage, normalizePhone } from '../lib/storage';
import { createOrder, formatDefaultTemplate, getFlavors, getSettings, upsertCustomerByPhone } from '../lib/firestore';

interface OrderBuilderProps {
  onTotalUnitsChange: (total: number) => void;
}

const fallbackSettings: Settings = {
  whatsappNumber: '5571993059366',
  minimumOrderUnits: 20,
  businessHours: '',
  defaultDeliveryFee: 0,
  whatsappTemplate: formatDefaultTemplate(),
  updatedAt: new Date().toISOString(),
};

const OrderBuilder: React.FC<OrderBuilderProps> = ({ onTotalUnitsChange }) => {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [qtyByFlavor, setQtyByFlavor] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<Settings>(fallbackSettings);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    tipoDeNegocio: '',
    bairro: '',
    formaEntrega: 'Entrega',
    observacoes: '',
  });
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFlavors(), getSettings()])
      .then(([remoteFlavors, remoteSettings]) => {
        setFlavors(remoteFlavors.filter((flavor) => flavor.active));
        if (remoteSettings) setSettings(remoteSettings);
      })
      .catch(() => {
        setFeedback({ type: 'error', message: 'Não foi possível carregar dados do pedido no momento.' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedItems = useMemo(
    () =>
      flavors
        .map((flavor) => {
          const quantity = qtyByFlavor[flavor.id] || 0;
          return {
            flavor,
            quantity,
            lineTotal: quantity * flavor.priceWholesale,
          };
        })
        .filter((item) => item.quantity > 0),
    [flavors, qtyByFlavor],
  );

  const totalUnits = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  useEffect(() => {
    onTotalUnitsChange(totalUnits);
  }, [onTotalUnitsChange, totalUnits]);

  const changeQty = (flavorId: string, diff: number) => {
    setQtyByFlavor((prev) => ({
      ...prev,
      [flavorId]: Math.max(0, (prev[flavorId] || 0) + diff),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    const cleanPhone = normalizePhone(formData.telefone);

    if (!formData.nome.trim()) return setFeedback({ type: 'error', message: 'Informe seu nome para continuar.' });
    if (!cleanPhone) return setFeedback({ type: 'error', message: 'Informe um telefone válido com DDD.' });
    if (selectedItems.length === 0) return setFeedback({ type: 'error', message: 'Selecione ao menos 1 item no pedido.' });
    if (totalUnits < settings.minimumOrderUnits) {
      return setFeedback({
        type: 'error',
        message: `Pedido mínimo atual é de ${settings.minimumOrderUnits} unidades.`,
      });
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const orderNumber = `BB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const baseOrder = {
      orderNumber,
      customerName: formData.nome.trim(),
      customerPhone: cleanPhone,
      businessType: formData.tipoDeNegocio.trim(),
      neighborhood: formData.bairro.trim(),
      deliveryType: formData.formaEntrega,
      notes: formData.observacoes.trim(),
      items: selectedItems.map((item) => ({
        flavorId: item.flavor.id,
        flavorName: item.flavor.name,
        unitPrice: item.flavor.priceWholesale,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      totalUnits,
      subtotalEstimated: subtotal,
      status: 'novo' as const,
      whatsappMessage: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const whatsappMessage = buildWhatsAppMessage(settings.whatsappTemplate || formatDefaultTemplate(), {
        ...baseOrder,
        whatsappMessage: '',
      });

      const persistedOrder = await createOrder({ ...baseOrder, whatsappMessage });

      await upsertCustomerByPhone({
        id: cleanPhone,
        name: baseOrder.customerName,
        phone: cleanPhone,
        businessType: baseOrder.businessType,
        neighborhood: baseOrder.neighborhood,
        notes: '',
        lastOrderAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');

      setFeedback({
        type: 'success',
        message: `Pedido ${persistedOrder.orderNumber} salvo no sistema e enviado para o WhatsApp!`,
      });

      setFormData({ nome: '', telefone: '', tipoDeNegocio: '', bairro: '', formaEntrega: 'Entrega', observacoes: '' });
      setQtyByFlavor({});
    } catch {
      setFeedback({
        type: 'error',
        message: 'Não foi possível salvar no Firestore. Tente novamente em instantes.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section id="monte-seu-pedido" darker>
      <div className="text-center mb-12">
        <span className="text-brand-gold font-bold tracking-widest text-sm uppercase mb-2 block">Pedido rápido</span>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-brand-cream mb-3">Monte seu pedido</h2>
        <p className="text-stone-400 max-w-2xl mx-auto">Escolha os sabores, defina as quantidades e envie tudo pronto para o WhatsApp.</p>
      </div>

      {isLoading ? (
        <div className="text-center text-stone-300">Carregando sabores e configurações...</div>
      ) : (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {flavors.map((flavor) => {
                const quantity = qtyByFlavor[flavor.id] || 0;
                return (
                  <article key={flavor.id} className="bg-brand-primary border border-white/10 rounded-xl p-4 flex gap-4 transition-all hover:border-brand-gold/40">
                    <img src={flavor.imageUrl} alt={flavor.name} className="w-20 h-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-bold text-brand-cream">{flavor.name}</h3>
                      <p className="text-xs text-stone-400 mb-3">{flavor.description}</p>
                      <p className="text-brand-gold text-sm font-semibold mb-3">R$ {flavor.priceWholesale.toFixed(2)} / un</p>
                      <div className="inline-flex items-center gap-3 bg-brand-dark border border-white/10 rounded-lg px-2 py-1">
                        <button type="button" onClick={() => changeQty(flavor.id, -1)} className="text-stone-200 hover:text-brand-gold"><Minus size={16} /></button>
                        <span className="text-brand-cream font-bold min-w-5 text-center">{quantity}</span>
                        <button type="button" onClick={() => changeQty(flavor.id, 1)} className="text-stone-200 hover:text-brand-gold"><Plus size={16} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="bg-brand-primary rounded-xl p-5 border border-white/10 grid md:grid-cols-2 gap-4">
              <input required placeholder="Nome" value={formData.nome} onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))} className="bg-brand-dark rounded-lg border border-stone-700 px-3 py-2" />
              <input required placeholder="Telefone" value={formData.telefone} onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))} className="bg-brand-dark rounded-lg border border-stone-700 px-3 py-2" />
              <input placeholder="Tipo de negócio" value={formData.tipoDeNegocio} onChange={(e) => setFormData((p) => ({ ...p, tipoDeNegocio: e.target.value }))} className="bg-brand-dark rounded-lg border border-stone-700 px-3 py-2" />
              <input placeholder="Bairro" value={formData.bairro} onChange={(e) => setFormData((p) => ({ ...p, bairro: e.target.value }))} className="bg-brand-dark rounded-lg border border-stone-700 px-3 py-2" />
              <select value={formData.formaEntrega} onChange={(e) => setFormData((p) => ({ ...p, formaEntrega: e.target.value }))} className="bg-brand-dark rounded-lg border border-stone-700 px-3 py-2 md:col-span-2">
                <option>Entrega</option>
                <option>Retirada</option>
              </select>
              <textarea placeholder="Observações" value={formData.observacoes} onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))} className="bg-brand-dark rounded-lg border border-stone-700 px-3 py-2 md:col-span-2 min-h-24" />
            </div>
          </div>

          <aside className="bg-brand-primary border border-white/10 rounded-xl p-5 h-fit lg:sticky lg:top-24">
            <h3 className="font-serif text-2xl text-brand-cream mb-4">Resumo do pedido</h3>
            <div className="space-y-2 text-sm max-h-52 overflow-auto pr-1">
              {selectedItems.length === 0 ? (
                <p className="text-stone-400">Nenhum item selecionado ainda.</p>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.flavor.id} className="flex justify-between gap-2 text-stone-300">
                    <span>{item.flavor.name} x{item.quantity}</span>
                    <span>R$ {item.lineTotal.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-sm space-y-1">
              <p className="text-stone-300">Total de unidades: <strong className="text-brand-cream">{totalUnits}</strong></p>
              <p className="text-stone-300">Subtotal estimado: <strong className="text-brand-gold">R$ {subtotal.toFixed(2)}</strong></p>
            </div>

            <div className="mt-4 bg-brand-gold/10 border border-brand-gold/30 rounded-lg p-3 text-xs text-stone-200 flex gap-2">
              <CircleAlert size={16} className="text-brand-gold mt-0.5" />
              Pedido mínimo atual: {settings.minimumOrderUnits} unidades. O pedido será salvo no Firestore antes do envio para o WhatsApp.
            </div>

            {feedback && (
              <p className={`text-sm mt-4 ${feedback.type === 'error' ? 'text-red-300' : 'text-green-300'}`}>{feedback.message}</p>
            )}

            <Button disabled={isSubmitting} type="submit" fullWidth variant="whatsapp" className="mt-4 !justify-center">
              <MessageCircle className="w-4 h-4" /> Enviar pedido no WhatsApp
            </Button>
          </aside>
        </form>
      )}
    </Section>
  );
};

export default OrderBuilder;
