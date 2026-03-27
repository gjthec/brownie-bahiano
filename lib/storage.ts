import { Order, OrderStatus } from '../types';

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

export const buildWhatsAppMessage = (template: string, order: Pick<Order, 'customerName' | 'customerPhone' | 'businessType' | 'neighborhood' | 'deliveryType' | 'items' | 'totalUnits' | 'subtotalEstimated' | 'notes'>) => {
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
