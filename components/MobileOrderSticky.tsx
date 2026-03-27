import React from 'react';

interface MobileOrderStickyProps {
  totalUnits: number;
}

const MobileOrderSticky: React.FC<MobileOrderStickyProps> = ({ totalUnits }) => {
  const scrollToOrder = () => {
    document.getElementById('monte-seu-pedido')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToOrder}
      className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-brand-gold text-brand-dark font-bold py-3 rounded-xl shadow-2xl border border-yellow-300"
    >
      Montar Pedido {totalUnits > 0 ? `(${totalUnits} itens)` : ''}
    </button>
  );
};

export default MobileOrderSticky;
