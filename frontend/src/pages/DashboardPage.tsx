import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { FreemiumCounter } from '../components/FreemiumCounter.tsx';
import { SearchIcon, TextScanIcon, UserIcon } from '../components/icons.tsx';
import { OutOfScansBanner } from '../components/OutOfScansBanner.tsx';
import { ALLERGEN_META } from '../components/allergenMeta.ts';
import { ScanWizard } from '../components/scan-wizard/ScanWizard.tsx';
import { ProductSearch } from '../components/ProductSearch.tsx';

type Mode = 'ingredients' | 'search';

const MODES = [
  { id: 'ingredients', label: 'Ingredientes', Icon: TextScanIcon },
  { id: 'search', label: 'Buscar', Icon: SearchIcon },
] as const;

export function DashboardPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('ingredients');

  if (!user) return null;

  return (
    <div className="min-h-dvh pb-[max(2rem,env(safe-area-inset-bottom))]">
      {/* Cabecera fija con contador freemium */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <span className="text-2xl font-extrabold tracking-tight">
            food<span className="text-brand-600">+</span>
          </span>
          <div className="flex items-center gap-2">
            <FreemiumCounter user={user} />
            <Link
              to="/profile"
              className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-slate-700 hover:bg-slate-100"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold uppercase ring-1 ring-slate-200">
                {user.name?.trim()[0] ?? <UserIcon className="size-4" />}
              </span>
              <span className="text-[10px] leading-none font-semibold">Mi cuenta</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* Recordatorio de contra qué se comparan los productos */}
        {user.allergies.length === 0 ? (
          <Link
            to="/profile"
            className="block rounded-2xl bg-blue-50 p-3 text-sm text-blue-800 ring-1 ring-blue-100 hover:bg-blue-100"
          >
            Configura tus alergias para recibir alertas personalizadas.{' '}
            <span className="font-semibold underline">Configurar →</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]" aria-label="Tus alergias">
              {user.allergies.map((a) => (
                <li
                  key={a.allergen}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  <span aria-hidden="true">{ALLERGEN_META[a.allergen]?.emoji}</span>
                  {a.label}
                </li>
              ))}
            </ul>
            <Link
              to="/profile"
              className="flex min-h-11 shrink-0 items-center px-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              Editar
            </Link>
          </div>
        )}

        {/* Sin escaneos: cuenta regresiva hasta la recarga + acceso a Premium */}
        {user.scansRemaining === 0 && <OutOfScansBanner resetsAt={user.scansResetAt} />}

        {/* Modos: foto de ingredientes (OCR) · búsqueda por nombre */}
        <div role="tablist" aria-label="Modo de consulta" className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={mode === id}
              aria-controls={`panel-${id}`}
              onClick={() => setMode(id)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
                mode === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        {/* key: cada pestaña empieza limpia al cambiar de modo */}
        <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`} key={mode}>
          {mode === 'ingredients' ? <ScanWizard /> : <ProductSearch />}
        </div>
      </main>
    </div>
  );
}
