import React from 'react';
import Section from './Section';
import { PRODUCTS, BRAND, WHATSAPP_MESSAGES } from '../constants';
import Button from './Button';
import { MessageCircle } from 'lucide-react';

const Products: React.FC = () => {
  const handleProductClick = () => {
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(WHATSAPP_MESSAGES.product)}`;
    window.open(url, '_blank');
  };

  return (
    <Section id="sabores" darker>
      <div className="text-center mb-12">
        <span className="text-brand-gold font-bold tracking-widest text-sm uppercase mb-2 block">Nossos Destaques</span>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-brand-cream">
          Sabores Irresistíveis
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="group bg-brand-primary rounded-xl overflow-hidden shadow-lg border border-white/5 hover:border-brand-gold/30 transition-all">
            <div className="relative h-56 overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-brand-cream mb-2">{product.name}</h3>
              <p className="text-stone-400 text-sm mb-4">{product.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-lg p-6 text-center max-w-2xl mx-auto">
        <p className="text-brand-cream mb-4">
          <span className="text-brand-gold font-bold">Nota:</span> Consulte disponibilidade, tamanhos e edições especiais no nosso catálogo completo.
        </p>
        <Button onClick={handleProductClick} variant="outline" className="!px-8 !py-2">
          <MessageCircle className="w-4 h-4 mr-2"/>
          Solicitar Catálogo Completo
        </Button>
      </div>
    </Section>
  );
};

export default Products;