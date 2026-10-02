import { useAuth } from '../context/AuthContext.tsx';
import { usePaywall } from '../context/PaywallContext.tsx';
import { CountdownClock, useCountdown } from './ResetCountdown.tsx';
import { SparklesIcon } from './icons.tsx';

/** Aviso fijo cuando se agotan los escaneos: cuenta regresiva hasta la recarga + acceso a Premium */
export function OutOfScansBanner({ resetsAt }: { resetsAt: string | null }) {
  const { refreshUser } = useAuth();
  const { openPaywall } = usePaywall();
  // Al llegar a 0 se vuelve a pedir el perfil: el aviso desaparece y el contador vuelve a 5/5
  const remainingMs = useCountdown(resetsAt, () => void refreshUser());

  return (
    <section
      aria-label="Escaneos agotados"
      className="overflow-hidden rounded-3xl bg-ink text-white shadow-md shadow-ink/20"
    >
      <div className="flex flex-col items-center gap-3 px-5 pt-5 pb-4 text-center">
        <p className="font-display text-lg leading-tight font-bold">Se acabaron tus escaneos gratuitos</p>
        {remainingMs !== null && remainingMs > 0 ? (
          <>
            <p className="text-sm text-sage">Vuelven en</p>
            <CountdownClock ms={remainingMs} tone="dark" />
          </>
        ) : (
          <p className="text-sm text-sage">Recargando tus escaneos…</p>
        )}
      </div>
      <button
        type="button"
        onClick={openPaywall}
        className="flex min-h-12 w-full items-center justify-center gap-2 border-t border-white/10 bg-white/5 text-sm font-semibold transition hover:bg-white/10 active:bg-white/15"
      >
        <SparklesIcon className="size-4 text-green-300" /> ¿No quieres esperar? Hazte Premium
      </button>
    </section>
  );
}
