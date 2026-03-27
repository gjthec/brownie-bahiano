import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Benefits from './components/Benefits';
import TargetAudience from './components/TargetAudience';
import Products from './components/Products';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import OrderBuilder from './components/OrderBuilder';
import MobileOrderSticky from './components/MobileOrderSticky';
import AdminApp from './components/admin/AdminApp';
import { ensureSeedData } from './lib/storage';

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [totalUnits, setTotalUnits] = useState(0);

  useEffect(() => {
    ensureSeedData();
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-cream selection:bg-brand-gold selection:text-brand-dark">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <TargetAudience />
        <Products />
        <OrderBuilder onTotalUnitsChange={setTotalUnits} />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <div className="my-16">
          <FinalCTA />
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
      <MobileOrderSticky totalUnits={totalUnits} />
    </div>
  );
}

export default App;
