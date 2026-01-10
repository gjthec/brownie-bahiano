import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BRAND, WHATSAPP_MESSAGES } from '../constants';

const FloatingWhatsApp: React.FC = () => {
  const handleClick = () => {
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(WHATSAPP_MESSAGES.general)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-500 transition-all duration-300 transform hover:scale-110 flex items-center gap-2 group border-2 border-white/20"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-bold">
        Pedir Tabela
      </span>
    </button>
  );
};

export default FloatingWhatsApp;