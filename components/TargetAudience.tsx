import React from 'react';
import Section from './Section';
import { TARGET_AUDIENCE } from '../constants';

const TargetAudience: React.FC = () => {
  return (
    <Section>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-cream mb-10">
          Ideal para o seu negócio
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TARGET_AUDIENCE.map((item, index) => (
            <div key={index} className="flex flex-col items-center justify-center p-4 bg-brand-primary rounded-lg border border-white/5 hover:border-brand-gold/20 transition-colors">
              <item.icon className="text-brand-gold mb-2 w-8 h-8 opacity-80" />
              <span className="text-stone-300 font-medium text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default TargetAudience;