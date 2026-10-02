// Estilos compartidos de botones con feedback táctil:
// hover → color un poco más intenso, sombra y leve elevación · active → se encoge (scale-95).

const base =
  'inline-flex items-center justify-center gap-2 font-semibold select-none ' +
  'transition-[transform,background-color,box-shadow,color] duration-150 ease-out ' +
  'active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50';

/** Acción principal (verde de marca; brand-700 para contraste AA con texto blanco) */
export const btnPrimary =
  `${base} rounded-2xl bg-brand-700 text-white shadow-md shadow-brand-700/20 ` +
  'hover:-translate-y-px hover:bg-brand-800 hover:shadow-lg hover:shadow-brand-700/35 ' +
  'active:translate-y-0 active:shadow-sm focus-visible:outline-brand-600';

/** Acción secundaria (contorno) */
export const btnSecondary =
  `${base} rounded-2xl bg-white text-slate-700 ring-1 ring-slate-300 ` +
  'hover:-translate-y-px hover:bg-slate-50 hover:text-slate-900 hover:shadow-md hover:shadow-slate-900/10 ' +
  'active:translate-y-0 active:shadow-none focus-visible:outline-slate-500';

/** Acción neutra oscura */
export const btnDark =
  `${base} rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/20 ` +
  'hover:-translate-y-px hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-900/30 ' +
  'active:translate-y-0 active:shadow-sm focus-visible:outline-slate-900';

/** Acción discreta, solo texto */
export const btnGhost =
  `${base} rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400`;
