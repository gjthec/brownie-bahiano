import React from 'react';
import { BRAND } from '../constants';
import { Instagram, ShoppingBag } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark border-t border-white/5 py-12 mt-16 text-stone-400 text-sm">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <ShoppingBag className="text-brand-gold" />
            <span className="font-serif font-bold text-xl text-brand-cream">{BRAND.name}</span>
          </div>
          <p className="max-w-xs">
            Brownies artesanais feitos com paixão para impulsionar o seu negócio.
          </p>
        </div>

        <div className="text-center md:text-right">
          <p className="mb-2"><strong>Atendimento:</strong> {BRAND.hours}</p>
          <p className="mb-2">{BRAND.address} - {BRAND.city}</p>
          <p className="mb-4">{BRAND.email}</p>
          
          <a 
            href={`https://instagram.com/${BRAND.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-gold hover:text-white transition-colors"
          >
            <Instagram size={20} />
            {BRAND.instagram}
          </a>
        </div>

      </div>
      <div className="text-center mt-12 pt-8 border-t border-white/5 opacity-50 text-xs">
        &copy; {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;