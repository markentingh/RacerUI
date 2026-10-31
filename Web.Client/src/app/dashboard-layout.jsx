import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HubProvider } from '@/context/hub';
import { GameProvider } from '@/context/game';
import { FooterProvider } from '@/context/footer';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

function InitOverlay() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => {
      const el = document.querySelector('.init');
      if (el) el.classList.add('fade');
      setTimeout(() => setGone(true), 1000);
    }, 500);
    return () => clearTimeout(t1);
  }, []);
  return gone ? null : <div className="init"></div>;
}

export default function DashboardLayout({ children }) {
  const location = useLocation();
  // Same as the original ui.view.inject - .content carries the view's
  // class so .content.history/.content.cars/etc selectors apply and
  // flex-based view layouts fill the remaining dash height
  const view = location.pathname.split('/')[2] || 'game';
  return (
    <HubProvider>
      <GameProvider>
        <FooterProvider>
          <InitOverlay />
          <div className="dash">
            <Navbar />
            <div className={`content ${view}`}>
              {children}
            </div>
          </div>
          <div className="footer"></div>
          <Footer />
          <div className="console"></div>
        </FooterProvider>
      </GameProvider>
    </HubProvider>
  );
}
