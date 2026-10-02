import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { CheckIcon, SparklesIcon, XIcon } from './icons.tsx';
import { btnGhost, btnPrimary } from './ui/buttons.ts';
import { CountdownClock, useCountdown } from './ResetCountdown.tsx';
import { SCAN_WINDOW_HOURS } from '../config/plan.ts';

// Precio del plan mensual (se mostrará el de Stripe cuando se configure)
export const PREMIUM_PRICE_LABEL = '$99 MXN';

interface Props {
  open: boolean;
  onClose: () => void;
  scanLimit: number;
  /** ISO: cuándo se recargan los escaneos gratuitos */
  resetsAt: string | null;
  /** Se llama cuando el contador llega a 0 (los escaneos ya se recargaron) */
  onReset?: () => void;
  /** Los escaneos ya se recargaron: se muestra la confirmación antes de cerrar */
  refilled?: boolean;
  /** Fase Stripe: iniciará el checkout. Mientras no exista se muestra "Muy pronto". */
  onSubscribe?: () => void;
}

const BENEFITS = [
  'Escaneos ilimitados de ingredientes',
  'Búsquedas ilimitadas por nombre',
  'Alertas para todas tus alergias en cada compra',
  'Cancela cuando quieras',
];

const FOCUSABLE = 'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])';

/** AnimatePresence mantiene el modal montado durante su animación de salida */
export function PaywallModal({ open, ...props }: Props) {
  return <AnimatePresence>{open && <PaywallSheet key="paywall" {...props} />}</AnimatePresence>;
}

function PaywallSheet({ onClose, scanLimit, resetsAt, onReset, refilled, onSubscribe }: Omit<Props, 'open'>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const reduceMotion = useReducedMotion();
  const remainingMs = useCountdown(resetsAt, onReset);

  useEffect(() => {
    // Guarda el foco previo, bloquea el scroll del fondo y enfoca el CTA
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      // Mantiene el foco dentro del modal
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [onClose]);

  const subscribe = () => {
    if (onSubscribe) onSubscribe();
    else setComingSoon(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Fondo desenfocado: al tocarlo se cierra, pero la acción bloqueada sigue bloqueada */}
      <m.div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.25 } }}
        exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.05 } }}
      />

      {/* Sube desde abajo hasta el centro con un spring */}
      <m.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        aria-describedby="paywall-desc"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white shadow-2xl shadow-slate-900/30"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '55vh', scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.28, duration: 0.6 } }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '35vh', scale: 0.96, transition: { duration: 0.22, ease: 'easeIn' } }}
      >
        {/* Cabecera con degradado */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-emerald-600 to-teal-700 px-6 pt-8 pb-7 text-white">
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-8 size-44 rounded-full bg-white/5" aria-hidden="true" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
            aria-label="Cerrar"
          >
            <XIcon className="size-5" />
          </button>

          <span className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <SparklesIcon className="size-7" />
          </span>
          <p className="relative text-sm font-semibold tracking-wide text-white/80 uppercase">food+ Premium</p>
          <h2 id="paywall-title" className="relative mt-1 text-2xl leading-tight font-extrabold">
            Compra tranquilo, sin límites
          </h2>
          <p id="paywall-desc" className="relative mt-2 text-sm text-white/90">
            Usaste tus {scanLimit} escaneos gratuitos. Se recargan cada {SCAN_WINDOW_HOURS} horas, o pásate a
            Premium para no tener que esperar.
          </p>
        </div>

        <div className="space-y-5 px-6 pt-6 pb-6">
          {/* Cuenta regresiva hasta la recarga gratuita */}
          {(remainingMs !== null || refilled) && (
            <div
              role={refilled ? 'status' : undefined}
              className="flex flex-col items-center gap-2.5 rounded-2xl bg-mint/60 px-4 py-4 text-center ring-1 ring-brand-100"
            >
              {refilled || remainingMs === 0 ? (
                <p className="text-base font-bold text-brand-800">¡Tus escaneos gratis ya volvieron!</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-brand-800">Tus {scanLimit} escaneos gratis vuelven en</p>
                  <CountdownClock ms={remainingMs ?? 0} size="lg" />
                </>
              )}
            </div>
          )}

          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-[15px] text-slate-700">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="flex items-end justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Plan mensual</p>
              <p className="text-3xl font-extrabold text-slate-900">
                {PREMIUM_PRICE_LABEL}
                <span className="text-base font-semibold text-slate-500">/mes</span>
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              Ilimitado
            </span>
          </div>

          {comingSoon ? (
            <p role="status" className="rounded-2xl bg-brand-50 p-4 text-center text-sm font-medium text-brand-800 ring-1 ring-brand-100">
              ¡Gracias por tu interés! Las suscripciones estarán disponibles muy pronto.
            </p>
          ) : (
            <button
              type="button"
              data-autofocus
              onClick={subscribe}
              className={`${btnPrimary} min-h-14 w-full text-lg font-bold`}
            >
              <SparklesIcon className="size-5" /> Hazte Premium
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`${btnGhost} min-h-11 w-full text-sm font-medium`}
          >
            {remainingMs ? 'Esperar a que se recarguen' : 'Ahora no'}
          </button>
        </div>
      </m.div>
    </div>
  );
}
