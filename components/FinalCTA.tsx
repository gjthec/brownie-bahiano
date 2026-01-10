import React, { useState } from 'react';
import Section from './Section';
import Button from './Button';
import { BRAND, WHATSAPP_MESSAGES } from '../constants';
import { Send, MapPin, Building2, User } from 'lucide-react';

const FinalCTA: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Cafeteria',
    neighborhood: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = WHATSAPP_MESSAGES.form(formData.name, formData.type, formData.neighborhood);
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Section id="contato" className="!py-0">
      <div className="bg-brand-gold rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Text Side */}
        <div className="md:w-1/2 p-8 md:p-12 bg-gradient-to-br from-brand-gold to-yellow-500 text-brand-dark flex flex-col justify-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Pronto para lucrar mais com nossos brownies?
          </h2>
          <p className="text-brand-dark/80 text-lg mb-8 font-medium">
            Preencha os dados e receba nossa tabela de atacado diretamente no seu WhatsApp agora mesmo.
          </p>
          <ul className="space-y-2 font-bold opacity-80">
            <li className="flex items-center gap-2">✓ Atendimento em segundos</li>
            <li className="flex items-center gap-2">✓ Catálogo PDF completo</li>
            <li className="flex items-center gap-2">✓ Condições especiais de lançamento</li>
          </ul>
        </div>

        {/* Form Side */}
        <div className="md:w-1/2 p-8 md:p-12 bg-brand-primary">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Seu Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-stone-500 w-5 h-5" />
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="João Silva"
                  className="w-full bg-brand-dark border border-stone-700 rounded-lg py-3 pl-10 pr-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Tipo de Negócio</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 text-stone-500 w-5 h-5" />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-brand-dark border border-stone-700 rounded-lg py-3 pl-10 pr-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-colors appearance-none"
                >
                  <option>Cafeteria</option>
                  <option>Mercado / Empório</option>
                  <option>Padaria</option>
                  <option>Cantina</option>
                  <option>Delivery</option>
                  <option>Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Seu Bairro</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-stone-500 w-5 h-5" />
                <input
                  required
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Centro"
                  className="w-full bg-brand-dark border border-stone-700 rounded-lg py-3 pl-10 pr-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
            </div>

            <Button type="submit" fullWidth variant="primary" className="mt-4 !text-brand-dark font-black !text-lg">
              Pedir Tabela Agora <Send className="ml-2 w-5 h-5" />
            </Button>
            
            <p className="text-center text-xs text-stone-500 mt-4">
              Ao clicar, você será redirecionado para o WhatsApp.
            </p>
          </form>
        </div>

      </div>
    </Section>
  );
};

export default FinalCTA;