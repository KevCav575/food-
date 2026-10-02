import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useAllergenCatalog } from '../hooks/useAllergenCatalog.ts';
import { updateAllergies, updateProfile } from '../services/profile.ts';
import { ApiError } from '../services/api.ts';
import { AllergenSelector } from '../components/AllergenSelector.tsx';
import { FreemiumCounter } from '../components/FreemiumCounter.tsx';
import { ArrowLeftIcon, CheckIcon, Spinner } from '../components/icons.tsx';
import type { Allergen, UserProfile } from '../types/api.ts';
import { btnPrimary, btnSecondary } from '../components/ui/buttons.ts';

const sameSet = (a: ReadonlySet<Allergen>, b: ReadonlySet<Allergen>) =>
  a.size === b.size && [...a].every((x) => b.has(x));

export function ProfilePage() {
  const { user } = useAuth();
  // El formulario se monta solo con el perfil cargado, así su estado inicial siempre es el guardado
  return user ? <ProfileForm user={user} /> : null;
}

function ProfileForm({ user }: { user: UserProfile }) {
  const { mergeUser, logout } = useAuth();
  const { catalog, error: catalogError, retry } = useAllergenCatalog();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onboarding = params.get('onboarding') === '1';

  const savedAllergies = useMemo(() => new Set(user.allergies.map((a) => a.allergen)), [user.allergies]);
  const [selected, setSelected] = useState<Set<Allergen>>(() => new Set(savedAllergies));
  const [name, setName] = useState(user.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const nameChanged = name.trim() !== (user.name ?? '');
  const allergiesChanged = !sameSet(selected, savedAllergies);
  const dirty = nameChanged || allergiesChanged;

  // Avisa antes de cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = (allergen: Allergen) => {
    setSaveError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(allergen)) next.delete(allergen);
      else next.add(allergen);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const [updatedUser, allergies] = await Promise.all([
        nameChanged ? updateProfile(name.trim() || null) : null,
        allergiesChanged ? updateAllergies([...selected]) : null,
      ]);
      mergeUser({
        ...(updatedUser ? { name: updatedUser.name } : {}),
        ...(allergies ? { allergies } : {}),
      });
      if (onboarding) navigate('/', { replace: true });
      else setToast(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? (Object.values(err.details ?? {}).flat()[0] ?? err.message)
          : 'No pudimos guardar. Revisa tu conexión.',
      );
    } finally {
      setSaving(false);
    }
  };

  const leave = (e: MouseEvent) => {
    if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) e.preventDefault();
  };

  const showSaveBar = dirty || onboarding;

  return (
    <div className={`min-h-dvh ${showSaveBar ? 'pb-36' : 'pb-10'}`}>
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-2 py-2">
          {!onboarding && (
            <Link
              to="/"
              onClick={leave}
              className="flex size-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
              aria-label="Volver al escáner"
            >
              <ArrowLeftIcon className="size-5" />
            </Link>
          )}
          <h1 className={`text-lg font-bold ${onboarding ? 'px-2' : ''}`}>
            {onboarding ? 'Configura tu perfil' : 'Mi perfil'}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pt-5">
        {onboarding && (
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-lg shadow-brand-600/20">
            <p className="text-xl font-bold">¡Bienvenido a food+! 👋</p>
            <p className="mt-1 text-sm text-white/90">
              Elige lo que debes evitar y te avisaremos al instante cuando un producto lo contenga.
            </p>
          </div>
        )}

        {/* Alergias */}
        <section aria-labelledby="allergies-title" className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 id="allergies-title" className="text-base font-bold text-slate-900">
                Mis alergias y restricciones
              </h2>
              <p className="text-sm text-slate-500">Toca para seleccionar todo lo que debas evitar.</p>
            </div>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="min-h-11 shrink-0 px-1 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Limpiar
              </button>
            )}
          </div>

          <p aria-live="polite" className="text-sm font-semibold text-slate-700">
            {selected.size === 0
              ? 'Ninguna seleccionada'
              : `${selected.size} ${selected.size === 1 ? 'seleccionada' : 'seleccionadas'}`}
          </p>

          {catalog ? (
            <AllergenSelector catalog={catalog} selected={selected} onToggle={toggle} disabled={saving} />
          ) : catalogError ? (
            <div role="alert" className="rounded-2xl bg-white p-5 text-center ring-1 ring-slate-200">
              <p className="text-sm text-slate-600">No pudimos cargar la lista de alérgenos.</p>
              <button
                type="button"
                onClick={() => void retry()}
                className="mt-3 min-h-11 rounded-xl px-4 font-semibold text-brand-700 ring-1 ring-brand-600"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2.5" aria-busy="true" aria-label="Cargando alérgenos">
              {Array.from({ length: 8 }, (_, i) => (
                <li key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </ul>
          )}

          <p className="text-xs leading-relaxed text-slate-500">
            Cubrimos los 14 alérgenos de declaración obligatoria. La intolerancia a la lactosa está incluida en
            “Leche y lactosa”.
          </p>
        </section>

        {/* Datos personales */}
        <section aria-labelledby="account-title" className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
          <h2 id="account-title" className="text-base font-bold text-slate-900">
            Tus datos
          </h2>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              autoComplete="given-name"
              maxLength={100}
              placeholder="¿Cómo te llamamos?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="min-h-12 w-full rounded-xl border-0 bg-slate-50 px-4 text-base ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
            />
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <p className="truncate rounded-xl bg-slate-50 px-4 py-3 text-slate-500">{user.email}</p>
          </div>
        </section>

        {/* Plan */}
        {!onboarding && (
          <section aria-labelledby="plan-title" className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-2">
              <h2 id="plan-title" className="text-base font-bold text-slate-900">
                Tu plan
              </h2>
              <FreemiumCounter user={user} />
            </div>
            <p className="text-sm text-slate-600">
              {user.plan === 'PREMIUM'
                ? 'Tienes escaneos ilimitados. ¡Gracias por apoyar food+!'
                : 'Plan gratuito. Pronto podrás pasarte a Premium para escanear sin límites.'}
            </p>
          </section>
        )}

        {!onboarding && (
          <button
            type="button"
            onClick={() => void logout()}
            className={`${btnSecondary} min-h-12 w-full text-red-600 hover:bg-red-50 hover:text-red-700`}
          >
            Cerrar sesión
          </button>
        )}
      </main>

      {/* Barra de guardado fija, al alcance del pulgar */}
      {showSaveBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-md space-y-2">
            {saveError && (
              <p role="alert" className="text-center text-sm font-medium text-red-700">
                {saveError}
              </p>
            )}
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || (!dirty && !onboarding)}
              className={`${btnPrimary} min-h-13 w-full text-base`}
            >
              {saving ? <Spinner /> : onboarding ? 'Continuar' : 'Guardar cambios'}
            </button>
            {onboarding && (
              <Link
                to="/"
                replace
                className="flex min-h-11 items-center justify-center text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Omitir por ahora
              </Link>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-40 flex justify-center px-4"
        >
          <p className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
            <CheckIcon className="size-4 text-brand-500" strokeWidth={3} /> Perfil actualizado
          </p>
        </div>
      )}
    </div>
  );
}
