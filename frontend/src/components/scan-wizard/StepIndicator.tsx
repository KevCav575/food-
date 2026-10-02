const STEPS = ['Inicio', 'Captura', 'Confirmar', 'Resultado'] as const;

/** Barra de progreso del asistente. `current` es el índice 0–3. */
export function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Progreso del escaneo">
      <p className="sr-only">
        Paso {current + 1} de {STEPS.length}: {STEPS[current]}
      </p>
      <ol className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {STEPS.map((label, i) => (
          <li key={label} className="space-y-1.5">
            <div
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                i <= current ? 'bg-brand-600' : 'bg-slate-200'
              }`}
            />
            <span
              className={`block truncate text-[11px] font-semibold ${
                i === current ? 'text-brand-700' : i < current ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
