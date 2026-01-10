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