import React from 'react';
import Section from './Section';
import { Star } from 'lucide-react';
import { REVIEWS } from '../constants';

const Testimonials: React.FC = () => {
  return (
    <Section id="depoimentos" darker>
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-cream mb-4">
          Quem vende recomenda
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REVIEWS.map((review) => (
          <div key={review.id} className="bg-brand-primary p-8 rounded-xl border border-white/5 relative">
            <div className="flex gap-1 text-brand-gold mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <p className="text-stone-300 italic mb-6">"{review.text}"</p>
            <div>
              <p className="font-bold text-brand-cream">{review.name}</p>
              <p className="text-brand-gold text-sm font-medium uppercase tracking-wider">{review.business}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default Testimonials;