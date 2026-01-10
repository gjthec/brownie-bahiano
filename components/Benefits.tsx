import React from 'react';
import Section from './Section';
import { BENEFITS } from '../constants';

const Benefits: React.FC = () => {
  return (
    <Section id="beneficios" darker>
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-cream mb-4">
          Por que revender nossos <span className="text-brand-gold">Brownies?</span>
        </h2>
        <p className="text-stone-400 max-w-2xl mx-auto">
          Mais do que um produto saboroso, oferecemos uma parceria para alavancar suas vendas e fidelizar seus clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {BENEFITS.map((benefit, index) => (
          <div 
            key={index} 
            className="bg-brand-primary p-6 rounded-xl border border-white/5 hover:border-brand-gold/30 transition-all duration-300 hover:transform hover:-translate-y-1 group"
          >
            <div className="w-12 h-12 bg-brand-gold/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-gold/20 transition-colors">
              <benefit.icon className="text-brand-gold w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-cream mb-2">{benefit.title}</h3>
            <p className="text-stone-400 leading-relaxed text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default Benefits;