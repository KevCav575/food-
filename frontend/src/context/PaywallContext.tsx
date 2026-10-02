import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PaywallModal } from '../components/PaywallModal.tsx';
import { useAuth } from './AuthContext.tsx';

interface PaywallContextValue {
  openPaywall: () => void;
}

const PaywallContext = createContext<PaywallContextValue | null>(null);

/** Un único paywall para toda la app; cualquier pantalla lo abre con usePaywall().openPaywall() */
export function PaywallProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [refilled, setRefilled] = useState(false);

  const openPaywall = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openPaywall }), [openPaywall]);

  // Al terminar la cuenta regresiva se piden los escaneos recargados
  const handleReset = useCallback(() => void refreshUser(), [refreshUser]);

  // Si los escaneos vuelven con el anuncio abierto (por su contador o por el del dashboard),
  // se avisa un momento y se cierra. sawEmpty evita cerrarlo cuando se abrió con el contador
  // local desactualizado (aún > 0) y el perfil todavía se está refrescando.
  const remaining = user?.scansRemaining;
  const sawEmpty = useRef(false);
  useEffect(() => {
    if (!open) {
      sawEmpty.current = false;
      setRefilled(false);
      return;
    }
    if (remaining === 0) sawEmpty.current = true;
    else if (sawEmpty.current && remaining !== null && remaining !== undefined) {
      setRefilled(true);
      const t = setTimeout(() => setOpen(false), 1600);
      return () => clearTimeout(t);
    }
  }, [open, remaining]);

  return (
    <PaywallContext.Provider value={value}>
      {children}
      {/* Fase Stripe: pasar onSubscribe para iniciar el checkout */}
      <PaywallModal
        open={open && user?.plan !== 'PREMIUM'}
        onClose={close}
        scanLimit={user?.scanLimit ?? 5}
        resetsAt={user?.scansResetAt ?? null}
        onReset={handleReset}
        refilled={refilled}
      />
    </PaywallContext.Provider>
  );
}

export function usePaywall(): PaywallContextValue {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error('usePaywall debe usarse dentro de <PaywallProvider>');
  return ctx;
}
