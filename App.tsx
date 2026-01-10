import React from 'react';
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

function App() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-cream selection:bg-brand-gold selection:text-brand-dark">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <TargetAudience />
        <Products />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <div className="my-16">
          <FinalCTA />
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

export default App;