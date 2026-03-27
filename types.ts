import React from 'react';

export interface NavItem {
  label: string;
  href: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
}

export interface Benefit {
  title: string;
  description: string;
  icon: React.ElementType;
}

export interface Testimonial {
  id: number;
  name: string;
  business: string;
  text: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BusinessType {
  label: string;
  value: string;
}

export type OrderStatus =
  | 'novo'
  | 'aguardando_confirmacao'
  | 'confirmado'
  | 'em_producao'
  | 'pronto'
  | 'saiu_para_entrega'
  | 'concluido'
  | 'cancelado';

export interface Flavor {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  priceWholesale: number;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  flavorId: string;
  flavorName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  changedAt: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  businessType: string;
  neighborhood: string;
  deliveryType: string;
  deliveryFee: number;
  notes: string;
  internalNotes: string;
  items: OrderItem[];
  totalUnits: number;
  subtotalEstimated: number;
  totalEstimated: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  whatsappMessage: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  businessType: string;
  neighborhood: string;
  notes: string;
  lastOrderAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  id: string;
  name: string;
  active: boolean;
  deliveryFee: number;
  estimatedTime: string;
  minimumOrderUnits: number;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  whatsappNumber: string;
  minimumOrderUnits: number;
  businessHours: string;
  defaultDeliveryFee: number;
  whatsappTemplate: string;
  updatedAt: string;
}
