import React, { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, MessageCircle } from 'lucide-react';
import { BRAND, WHATSAPP_MESSAGES } from '../constants';
import Button from './Button';
import { getDefaultLandingConfig, getLandingConfig, LandingConfig } from '../lib/firestore';

const Hero: React.FC = () => {
  const [landing, setLanding] = useState<LandingConfig>(getDefaultLandingConfig());

  useEffect(() => {
    getLandingConfig().then((data) => {
      if (data) setLanding(data);
    }).catch(() => {
      // mantém fallback local
    });
  }, []);

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(WHATSAPP_MESSAGES.general)}`;
    window.open(url, '_blank');
  };

  const scrollToProducts = () => {
    document.getElementById('sabores')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToOrderBuilder = () => {
    document.getElementById('monte-seu-pedido')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=80&w=1920&auto=format&fit=crop"
          alt="Brownies deliciosos empilhados"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
        <span className="inline-block py-1 px-3 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30 text-sm font-bold tracking-wider mb-6 animate-fade-in-up">
          {landing.hero_badge}
        </span>

        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-brand-cream mb-6 leading-[1.18] md:leading-[1.12] max-w-3xl mx-auto">
          {landing.hero_title}
        </h1>

        <p className="text-lg md:text-xl text-stone-200 mb-8 max-w-2xl font-light drop-shadow-md">
          {landing.hero_subtitle}
        </p>

        <img
          src="https://i.ibb.co/d1R8Gyw/Whats-App-Image-2026-01-10-at-7-05-11-PM.jpg"
          alt="Logo Brownie Baiano"
          className="w-40 h-40 md:w-56 md:h-56 object-contain mb-8 drop-shadow-2xl rounded-full border-4 border-brand-gold/30"
        />

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button onClick={handleWhatsAppClick} variant="whatsapp" icon={MessageCircle} className="!text-lg !px-8">
            {landing.hero_primary_button}
          </Button>
          <Button onClick={scrollToOrderBuilder} variant="primary" icon={ClipboardList}>
            {landing.hero_secondary_button}
          </Button>
          <Button onClick={scrollToProducts} variant="outline" icon={ArrowRight}>
            Ver Sabores
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
