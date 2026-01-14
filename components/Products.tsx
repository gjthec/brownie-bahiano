import React from "react";
import Section from "./Section";
import { PRODUCTS, BRAND, WHATSAPP_MESSAGES } from "../constants";
import Button from "./Button";
import { MessageCircle } from "lucide-react";

const Products: React.FC = () => {
  // Duplicamos a lista para criar o efeito de loop infinito (Marquee)
  // Triplicamos para garantir que preencha telas ultrawide suavemente
  const sliderItems = [...PRODUCTS, ...PRODUCTS, ...PRODUCTS];

  const handleProductClick = () => {
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
      WHATSAPP_MESSAGES.product
    )}`;
    window.open(url, "_blank");
  };

  return (
    <Section id="sabores" darker>
      <div className="text-center mb-12">
        <span className="text-brand-gold font-bold tracking-widest text-sm uppercase mb-2 block">
          Nossos Destaques
        </span>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-brand-cream">
          Sabores Irresistíveis
        </h2>
      </div>

      {/* Marquee Container */}
      <div className="mb-12 w-full overflow-hidden relative">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {sliderItems.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="w-[85vw] md:w-[40vw] lg:w-[28vw] px-4 flex-shrink-0"
            >
              <div className="bg-brand-primary rounded-xl overflow-hidden shadow-xl border border-white/5 hover:border-brand-gold/30 transition-all duration-300 h-full flex flex-col group transform hover:-translate-y-1">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-brand-cream mb-2">
                      {product.name}
                    </h3>
                    <p className="text-stone-400 text-sm">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-lg p-6 text-center max-w-2xl mx-auto backdrop-blur-sm">
        <p className="text-brand-cream mb-4">
          <span className="text-brand-gold font-bold">Nota:</span> Consulte
          disponibilidade, tamanhos e edições especiais no nosso catálogo
          completo.
        </p>
        <Button
          onClick={handleProductClick}
          variant="outline"
          className="!px-8 !py-2 hover:bg-brand-gold hover:text-brand-dark"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Solicitar Catálogo Completo
        </Button>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 15s;
          }
        }
      `}</style>
    </Section>
  );
};

export default Products;
