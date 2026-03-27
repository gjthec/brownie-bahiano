import React, { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { BRAND, WHATSAPP_MESSAGES } from '../constants';
import Button from './Button';

const navItems = [
  { label: 'Benefícios', id: 'beneficios' },
  { label: 'Sabores', id: 'sabores' },
  { label: 'Montar Pedido', id: 'monte-seu-pedido' },
  { label: 'Como Funciona', id: 'como-funciona' },
  { label: 'Depoimentos', id: 'depoimentos' },
];

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(WHATSAPP_MESSAGES.general)}`;
    window.open(url, '_blank');
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-brand-dark/95 backdrop-blur-sm shadow-xl py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
          <div className="bg-brand-gold p-1.5 rounded text-brand-dark">
            <ShoppingBag size={24} />
          </div>
          <span className="font-serif font-bold text-xl md:text-2xl text-brand-cream tracking-wide">{BRAND.name}</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => scrollToSection(item.id)} className="text-brand-cream/80 hover:text-brand-gold transition-colors font-medium">
              {item.label}
            </button>
          ))}
          <Button onClick={handleWhatsAppClick} variant="primary" className="!py-2 !px-4 !text-sm">
            WhatsApp Atacado
          </Button>
        </nav>

        <button className="md:hidden text-brand-cream" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-brand-primary border-t border-white/10 p-4 flex flex-col gap-4 shadow-2xl">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => scrollToSection(item.id)} className="text-left text-brand-cream/90 py-2 border-b border-white/5">
              {item.label}
            </button>
          ))}
          <Button onClick={handleWhatsAppClick} fullWidth>
            Solicitar Tabela
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
