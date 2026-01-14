import React from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { BRAND, WHATSAPP_MESSAGES } from "../constants";
import Button from "./Button";

const Hero: React.FC = () => {
  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
      WHATSAPP_MESSAGES.general
    )}`;
    window.open(url, "_blank");
  };

  const scrollToProducts = () => {
    document.getElementById("sabores")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden"
    >
      {/* Background Image with Stronger Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=80&w=1920&auto=format&fit=crop"
          alt="Brownies deliciosos empilhados"
          className="w-full h-full object-cover"
        />

        {/* Camada Escura Sólida (70% de opacidade) - Garante leitura em fotos claras */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Gradiente para suavizar a transição com o rodapé da seção */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
        <span className="inline-block py-1 px-3 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30 text-sm font-bold tracking-wider mb-6 animate-fade-in-up">
          ATACADO PARA REVENDEDORES EM {BRAND.city.toUpperCase()}
        </span>

        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-brand-cream mb-6 leading-tight drop-shadow-xl">
          Brownies para revenda com{" "}
          <span className="text-brand-gold italic">alta saída</span> e ótima
          margem.
        </h1>

        <p className="text-lg md:text-xl text-stone-200 mb-8 max-w-2xl font-light drop-shadow-md">
          Produção própria • Receita artesanal • Reposição rápida • Vende o ano
          todo
        </p>

        {/* Imagem da Logo solicitada */}
        <img
          src="https://i.ibb.co/d1R8Gyw/Whats-App-Image-2026-01-10-at-7-05-11-PM.jpg"
          alt="Logo Brownie Baiano"
          className="w-40 h-40 md:w-56 md:h-56 object-contain mb-8 drop-shadow-2xl rounded-full border-4 border-brand-gold/30"
        />

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button
            onClick={handleWhatsAppClick}
            variant="whatsapp"
            icon={MessageCircle}
            className="!text-lg !px-8"
          >
            Quero a Tabela do Atacado
          </Button>
          <Button
            onClick={scrollToProducts}
            variant="outline"
            icon={ArrowRight}
          >
            Ver Sabores
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
