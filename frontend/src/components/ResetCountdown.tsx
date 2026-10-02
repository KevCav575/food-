import { useEffect, useRef, useState } from 'react';

/** Milisegundos que faltan para `target`, actualizados cada segundo. Llama a `onDone` una vez al llegar a 0. */
export function useCountdown(target: string | null, onDone?: () => void): number | null {
  const targetMs = target ? new Date(target).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (targetMs === null) return;
    setNow(Date.now());
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= targetMs) {
        clearInterval(id);
        doneRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return targetMs === null ? null : Math.max(0, targetMs - now);
}

const pad = (n: number) => String(n).padStart(2, '0');

function split(ms: number) {
  const total = Math.ceil(ms / 1000);
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

/** "3 h 12 min" — para lectores de pantalla y textos breves */
export function formatRemaining(ms: number): string {
  const { h, m, s } = split(ms);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${s} s`;
}

interface Props {
  ms: number;
  /** "light" sobre fondos claros, "dark" sobre fondos de color */
  tone?: 'light' | 'dark';
  size?: 'md' | 'lg';
}

/** Reloj HH:MM:SS. El valor visible cambia cada segundo, pero solo se anuncia el texto aproximado. */
export function CountdownClock({ ms, tone = 'light', size = 'md' }: Props) {
  const { h, m, s } = split(ms);
  const units = [
    { v: pad(h), label: 'h' },
    { v: pad(m), label: 'min' },
    { v: pad(s), label: 's' },
  ];
  const box =
    tone === 'light' ? 'bg-white text-ink ring-1 ring-line' : 'bg-white/15 text-white ring-1 ring-white/25';
  const digits = size === 'lg' ? 'text-3xl' : 'text-lg';
  const cell = size === 'lg' ? 'min-w-16 px-2 py-2' : 'min-w-11 px-1.5 py-1';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="sr-only">{formatRemaining(ms)}</span>
      {units.map((u, i) => (
        <span key={u.label} className="inline-flex items-center gap-1.5" aria-hidden="true">
          {i > 0 && <span className={`font-display font-bold opacity-50 ${digits}`}>:</span>}
          <span className={`flex flex-col items-center rounded-xl ${box} ${cell}`}>
            <span className={`font-display leading-none font-extrabold tabular-nums ${digits}`}>{u.v}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase opacity-70">{u.label}</span>
          </span>
        </span>
      ))}
    </span>
  );
}
