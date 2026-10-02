import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { ApiError } from '../services/api.ts';
import { ArrowLeftIcon, ShieldCheckIcon, Spinner } from '../components/icons.tsx';
import { btnPrimary } from '../components/ui/buttons.ts';
import { FREE_SCANS, SCAN_WINDOW_HOURS } from '../config/plan.ts';

type Mode = 'login' | 'register';

const COPY: Record<Mode, { title: string; subtitle: string; submit: string; switchText: string; switchCta: string; switchTo: string }> = {
  login: {
    title: 'Bienvenido de vuelta',
    subtitle: 'Inicia sesión para seguir revisando tus productos.',
    submit: 'Iniciar sesión',
    switchText: '¿No tienes cuenta?',
    switchCta: 'Regístrate gratis',
    switchTo: '/registro',
  },
  register: {
    title: 'Crea tu cuenta',
    subtitle: `Incluye ${FREE_SCANS} escaneos gratis cada ${SCAN_WINDOW_HOURS} horas. Sin tarjeta.`,
    submit: 'Crear cuenta',
    switchText: '¿Ya tienes cuenta?',
    switchCta: 'Inicia sesión',
    switchTo: '/login',
  },
};

const inputClass =
  'min-h-12 w-full rounded-xl border-0 bg-white px-4 text-base text-ink ring-1 ring-line ' +
  'placeholder:text-ink-muted/70 focus:ring-2 focus:ring-brand-600 focus:outline-none';

export function AuthPage({ mode }: { mode: Mode }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name.trim() || undefined);
      // La redirección (escáner u onboarding de alergias) la hace App al detectar la sesión
    } catch (err) {
      if (err instanceof ApiError) {
        setError(Object.values(err.details ?? {}).flat()[0] ?? err.message);
      } else {
        setError('No pudimos conectar con el servidor.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ground font-sans text-ink">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-1.5 rounded-xl pr-2 text-sm font-medium text-ink-soft transition hover:text-ink active:scale-95"
        >
          <ArrowLeftIcon className="size-4" /> Inicio
        </Link>
        <Link to="/" className="font-display text-2xl font-extrabold tracking-[-0.03em] text-ink" aria-label="food+, ir al inicio">
          food<span className="text-brand-600">+</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <h1 className="font-display text-[34px] leading-tight font-extrabold tracking-[-0.03em]">{copy.title}</h1>
        <p className="mt-2 text-ink-soft">{copy.subtitle}</p>

        <form onSubmit={submit} className="mt-8 space-y-4" noValidate={false}>
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                Nombre <span className="font-normal text-ink-muted">(opcional)</span>
              </span>
              <input
                type="text"
                autoComplete="given-name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Contraseña</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={mode === 'register' ? 'password-hint' : undefined}
              className={inputClass}
            />
            {mode === 'register' && (
              <span id="password-hint" className="mt-1.5 block text-xs text-ink-muted">
                Mínimo 8 caracteres, con letras y números.
              </span>
            )}
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className={`${btnPrimary} min-h-13 w-full text-base`}>
            {submitting ? <Spinner /> : copy.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          {copy.switchText}{' '}
          <Link to={copy.switchTo} replace className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            {copy.switchCta}
          </Link>
        </p>

        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
          Tu contraseña nunca se guarda en texto plano y la sesión usa cookies seguras. food+ es una herramienta
          orientativa: verifica siempre el envase.
        </p>
      </main>
    </div>
  );
}
