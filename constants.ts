import { Box, ChefHat, Clock, TrendingUp, ShoppingBag, Coffee, Store, MapPin } from 'lucide-react';
import { Benefit, Product, Testimonial, FAQItem } from './types';

// ==========================================
// CONFIGURAÇÃO DA MARCA (EDITAR AQUI)
// ==========================================
export const BRAND = {
  name: "Brownie Bahiano",
  city: "Salvador e Região",
  whatsapp: "5535998842525", // Número atualizado
  instagram: "@brownie_baiano",
  email: "{{EMAIL}}",
  address: "{{ENDERECO}}",
  hours: "{{HORARIO}}",
};

// ==========================================
// MENSAGENS DO WHATSAPP
// ==========================================
export const WHATSAPP_MESSAGES = {
  general: `Oi! Quero revender os brownies da ${BRAND.name}. Pode me enviar a tabela do atacado?`,
  product: `Oi! Vi os sabores no site e quero saber mais sobre os brownies da ${BRAND.name}.`,
  form: (name: string, type: string, neighborhood: string) => 
    `Oi! Quero revender os brownies da ${BRAND.name}. Pode me enviar a tabela do atacado, pedido mínimo e prazo de reposição? Meu nome é ${name}, meu negócio é: ${type}. Bairro: ${neighborhood}.`
};

// ==========================================
// CONTEÚDO DO SITE
// ==========================================

export const BENEFITS: Benefit[] = [
  {
    title: "Margem de Lucro",
    description: "Preço especial para revenda garantindo excelente retorno sobre o investimento.",
    icon: TrendingUp,
  },
  {
    title: "Produção Artesanal",
    description: "Feito com chocolate nobre e manteiga de verdade. Qualidade que fideliza.",
    icon: ChefHat,
  },
  {
    title: "Reposição Rápida",
    description: "Produção ágil para você nunca ficar sem estoque nos dias de maior movimento.",
    icon: Clock,
  },
  {
    title: "Alta Saída",
    description: "Um produto que vende o ano todo, do café da manhã à sobremesa.",
    icon: Box,
  },
];

export const TARGET_AUDIENCE = [
  { label: "Cafeterias", icon: Coffee },
  { label: "Mercados", icon: ShoppingBag },
  { label: "Padarias", icon: ChefHat },
  { label: "Empórios", icon: Store },
  { label: "Cantinas", icon: MapPin },
  { label: "Delivery", icon: Box },
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Tradicional",
    description: "O clássico. Casquinha crocante e interior úmido e denso.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Recheado Doce de Leite",
    description: "Generosa camada de doce de leite cremoso no meio.",
    image: "https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Ninho com Nutella",
    description: "A combinação campeã de vendas. Irresistível.",
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Chocolate Branco",
    description: "Blondie com pedaços de chocolate branco nobre.",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Nozes",
    description: "Crocância e sofisticação para paladares exigentes.",
    image: "https://guiadacozinha.com.br/wp-content/uploads/2019/10/brownie-creme-avela-nozes-350x230.jpg"  
    },
  {
    id: 6,
    name: "Edição Sazonal",
    description: "Sabores especiais para datas comemorativas.",
    image: "https://images.unsplash.com/photo-1589218436045-ee320057f443?q=80&w=800&auto=format&fit=crop"
  },
];

export const REVIEWS: Testimonial[] = [
  {
    id: 1,
    name: "Mariana S.",
    business: "Café da Praça",
    text: "Os clientes amam! A saída é muito rápida e o atendimento deles é impecável. Nunca me deixaram na mão.",
  },
  {
    id: 2,
    name: "Roberto F.",
    business: "Mercadinho Express",
    text: "Comecei com um pedido mínimo para testar e hoje é um dos itens que mais giram no caixa.",
  },
  {
    id: 3,
    name: "Carla M.",
    business: "Cantina Escolar",
    text: "A qualidade é superior a tudo que já vendemos antes. As crianças (e os professores) adoram.",
  },
  {
    id: 4,
    name: "Pedro A.",
    business: "Burger Delivery",
    text: "Ótima sobremesa para upsell no delivery. A embalagem vem perfeita e o produto chega fresco.",
  },
];

export const FAQS: FAQItem[] = [
  {
    question: "Qual o pedido mínimo para atacado?",
    answer: "Trabalhamos com um pedido mínimo super acessível para você começar a testar a saída. Chame no WhatsApp para ver a tabela atualizada.",
  },
  {
    question: "Qual a validade dos brownies?",
    answer: "Nossos brownies têm validade de 15 dias em temperatura ambiente e até 30 dias refrigerados, mantendo a textura perfeita.",
  },
  {
    question: "Vocês entregam em toda a cidade?",
    answer: `Sim! Entregamos em toda ${BRAND.city} e região. Também temos opção de retirada no nosso ponto de produção.`,
  },
  {
    question: "Os produtos já vêm embalados?",
    answer: "Sim, entregamos prontos para venda, com embalagem individual, etiqueta de validade e tabela nutricional.",
  },
];