import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { PaywallProvider } from './context/PaywallContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* LazyMotion + m: solo carga las funciones de animación que usamos (bundle más ligero) */}
    <LazyMotion features={domAnimation} strict>
      <BrowserRouter>
        <AuthProvider>
          <PaywallProvider>
            <App />
          </PaywallProvider>
        </AuthProvider>
      </BrowserRouter>
    </LazyMotion>
  </StrictMode>,
);
