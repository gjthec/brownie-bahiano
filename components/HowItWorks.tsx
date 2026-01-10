import React from 'react';
import Section from './Section';
import { MessageSquare, FileText, Truck } from 'lucide-react';
import { BRAND } from '../constants';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: MessageSquare,
      title: "1. Chame no WhatsApp",
      description: "Clique em um dos botões e fale com nossa equipe comercial.",
    },
    {
      icon: FileText,
      title: "2. Receba o Catálogo",
      description: "Enviamos a tabela de preços, pedido mínimo e condições de pagamento.",
    },
    {
      icon: Truck,
      title: "3. Produção e Entrega",
      description: `Produzimos seu pedido fresquinho e entregamos em ${BRAND.city} ou você retira.`,
    },
  ];

  return (
    <Section id="como-funciona">
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-cream">
          Como funciona o Atacado
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent z-0"></div>

        {steps.map((step, index) => (
          <div key={index} className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-brand-primary border-2 border-brand-gold rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <step.icon className="text-brand-gold w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-brand-cream mb-3">{step.title}</h3>
            <p className="text-stone-400 text-sm max-w-xs">{step.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default HowItWorks;