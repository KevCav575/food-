import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import {
  AlertTriangleIcon,
  CheckIcon,
  HelpCircleIcon,
  PhotoCameraIcon,
  SearchIcon,
  ShieldCheckIcon,
  TextScanIcon,
  XIcon,
} from '../components/icons.tsx';
import { btnPrimary } from '../components/ui/buttons.ts';
import { PREMIUM_PRICE_LABEL } from '../components/PaywallModal.tsx';
import { FREE_SCANS, SCAN_WINDOW_HOURS } from '../config/plan.ts';

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------

const ALLERGENS = [
  'Gluten',
  'Leche y lactosa',
  'Cacahuate',
  'Frutos de cáscara',
  'Huevo',
  'Soya',
  'Pescado',
  'Crustáceos',
  'Moluscos',
  'Ajonjolí',
  'Apio',
  'Mostaza',
  'Sulfitos',
  'Altramuz',
];

const STEPS = [
  {
    title: 'Dinos qué debes evitar',
    text: 'Elige tus alergias e intolerancias una sola vez. Las tendremos presentes en cada análisis.',
  },
  {
    title: 'Fotografía los ingredientes',
    text: 'Encuadra la lista en el marco guía. Funciona con cualquier empaque: no depende de un código de barras.',
  },
  {
    title: 'Mira el semáforo',
    text: 'En segundos sabes si es seguro, y qué ingrediente exacto activó la alerta.',
  },
];

const STATES = [
  {
    title: 'Seguro',
    text: 'No encontramos ningún alérgeno de tu perfil.',
    Icon: ShieldCheckIcon,
    box: 'bg-green-50 ring-green-200',
    icon: 'text-green-700',
    heading: 'text-green-900',
    body: 'text-green-800',
  },
  {
    title: 'Precaución',
    text: 'La etiqueta dice que puede contener trazas de algo que evitas.',
    Icon: AlertTriangleIcon,
    box: 'bg-amber-50 ring-amber-200',
    icon: 'text-amber-700',
    heading: 'text-amber-950',
    body: 'text-amber-800',
  },
  {
    title: 'Peligroso',
    text: 'Contiene un alérgeno de tu perfil y te mostramos cuál.',
    Icon: XIcon,
    box: 'bg-red-50 ring-red-200',
    icon: 'text-red-700',
    heading: 'text-red-950',
    body: 'text-red-800',
  },
  {
    title: 'Sin datos',
    text: 'No hay texto suficiente para decidir. Toma otra foto.',
    Icon: HelpCircleIcon,
    box: 'bg-[#F1F3EE] ring-line',
    icon: 'text-ink-soft',
    heading: 'text-ink',
    body: 'text-ink-soft',
  },
];

const FEATURES = [
  {
    title: 'Lee la letra pequeña',
    text: 'Separa la lista de ingredientes del resto de la etiqueta y entiende “Contiene:” y “Puede contener”.',
    Icon: TextScanIcon,
  },
  {
    title: 'Conoce los nombres escondidos',
    text: 'Caseína, suero, sémola o ajonjolí: reconoce los derivados, en español y en inglés.',
    Icon: SearchIcon,
  },
  {
    title: 'Tu foto no se guarda',
    text: 'La imagen se procesa para leer el texto y se descarta. Solo guardamos el resultado en tu historial.',
    Icon: LockIcon,
  },
];

const FAQ = [
  {
    q: '¿food+ reemplaza leer la etiqueta?',
    a: 'No. Es una ayuda orientativa para revisar más rápido. Verifica siempre el envase y, si tienes una alergia grave, sigue las indicaciones de tu médico.',
  },
  {
    q: '¿Qué pasa si la foto sale borrosa?',
    a: 'Te avisamos que no pudimos leer el texto y no se descuenta ningún escaneo. Si la lectura fue difícil, te pedimos comparar con el empaque.',
  },
  {
    q: '¿En qué idiomas funciona?',
    a: 'Lee etiquetas en español e inglés, y reconoce también términos comunes en francés.',
  },
  {
    q: `¿Qué pasa cuando termino mis ${FREE_SCANS} escaneos?`,
    a: `Se recargan solos ${SCAN_WINDOW_HOURS} horas después del primer escaneo de la tanda, y en la app verás una cuenta regresiva. Si no quieres esperar, podrás pasarte a Premium.`,
  },
];

const NAV = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#semaforo', label: 'El semáforo' },
  { href: '#precios', label: 'Precios' },
  { href: '#preguntas', label: 'Preguntas' },
];

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------

function LockIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Aparece al entrar en pantalla (fundido + leve subida); inmóvil si se pide reducir movimiento */
function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** 'li' para animar directamente un elemento de lista */
  as?: 'div' | 'li';
}) {
  const reduce = useReducedMotion();
  if (reduce) return as === 'li' ? <li className={className}>{children}</li> : <div className={className}>{children}</div>;
  const Comp = as === 'li' ? m.li : m.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ type: 'spring', bounce: 0.18, duration: 0.7, delay }}
    >
      {children}
    </Comp>
  );
}

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="text-sm font-bold tracking-[0.06em] text-brand-700 uppercase">{children}</span>
);

const SectionTitle = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h2
    className={`font-display text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink sm:text-5xl ${className}`}
  >
    {children}
  </h2>
);

const Logo = ({ className = '' }: { className?: string }) => (
  <span className={`font-display font-extrabold tracking-[-0.03em] ${className}`}>
    food<span className="text-brand-600">+</span>
  </span>
);

// Botones de la landing: mismo feedback táctil que la app (hover eleva, active scale-95)
const ctaLight =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-ink ring-1 ring-[#CBD3C6] ' +
  'transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-px hover:shadow-md hover:shadow-ink/10 ' +
  'active:translate-y-0 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/** Vista previa del resultado tal como se ve en la app (no es una captura) */
function PhoneMock() {
  return (
    <div className="w-[300px] rounded-[44px] bg-ink p-3 shadow-[0_40px_80px_-30px_rgba(16,38,26,0.45)] sm:w-[320px]" aria-hidden="true">
      <div className="flex flex-col overflow-hidden rounded-[34px] bg-[#F8FAF7]">
        <div className="flex items-center justify-between border-b border-[#E6EAE2] px-[18px] pt-[18px] pb-3">
          <Logo className="text-xl text-ink" />
          <span className="rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-soft ring-1 ring-[#D9DFD4]">
            Escaneos: 3/5
          </span>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-2.5 rounded-[20px] border-2 border-red-200 bg-red-50 p-3.5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-700">
                <AlertTriangleIcon className="size-[22px]" />
              </span>
              <div>
                <p className="text-lg leading-tight font-extrabold text-red-800">Peligroso para ti</p>
                <p className="mt-0.5 text-xs text-red-800">Contiene alérgenos de tu perfil: Leche y lactosa.</p>
              </div>
            </div>
            <span className="self-start rounded-full bg-red-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
              Leche y lactosa
            </span>
          </div>
          <div className="rounded-[20px] bg-white p-3.5 ring-1 ring-[#E6EAE2]">
            <p className="mb-1.5 text-[13px] font-bold text-ink">Ingredientes</p>
            <p className="text-[12.5px] leading-[1.75] text-ink-soft">
              Harina de trigo, azúcar, aceite vegetal,{' '}
              <mark className="rounded-md bg-red-100 px-1 font-bold text-red-800">leche en polvo</mark>, sal yodada,
              lecitina de soya.
            </p>
          </div>
          <p className="rounded-[14px] bg-amber-50 px-3 py-2.5 text-[11.5px] text-amber-800">
            Puede contener trazas de: Cacahuate
          </p>
          <div className="flex min-h-11 items-center justify-center rounded-[14px] bg-ink text-[13px] font-semibold text-white">
            Escanear otro producto
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export function LandingPage() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-dvh bg-ground font-sans text-ink">
      {/* Navegación */}
      <header className="sticky top-0 z-30 border-b border-[#E3E7DD] bg-ground/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3 sm:px-10 sm:py-4">
          <a href="#inicio" className="text-[28px] text-ink no-underline" aria-label="food+, ir al inicio">
            <Logo />
          </a>
          <nav aria-label="Secciones" className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[15px] font-medium text-ink-soft transition hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-sm font-semibold whitespace-nowrap text-ink transition hover:bg-ink/5 active:scale-95 sm:px-4 sm:text-[15px]"
            >
              Iniciar sesión
            </Link>
            <Link to="/registro" className={`${btnPrimary} min-h-11 rounded-xl px-3.5 text-sm whitespace-nowrap sm:px-4 sm:text-[15px]`}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section id="inicio" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-14 pb-20 sm:px-10 sm:pt-[88px] sm:pb-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-7">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-sm font-semibold text-brand-800">
                  <ShieldCheckIcon className="size-4" /> Para personas con alergias e intolerancias
                </span>
              </div>
              <h1 className="font-display text-[44px] leading-[1.02] font-extrabold tracking-[-0.035em] sm:text-[60px] xl:text-[68px]">
                  Una foto a la etiqueta. La respuesta, al instante.
                </h1>
              <p className="max-w-[520px] text-lg leading-relaxed text-ink-soft sm:text-[19px]">
                  Fotografía la lista de ingredientes de cualquier producto y food+ te dice si contiene algo que debas
                  evitar, resaltando exactamente qué ingrediente es el problema.
                </p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link to="/registro" className={`${btnPrimary} min-h-14 px-6 text-[17px] font-bold`}>
                    <PhotoCameraIcon className="size-5" /> Empieza gratis
                  </Link>
                  <Link to="/login" className={`${ctaLight} min-h-14 px-5 text-[17px]`}>
                    Ya tengo cuenta
                  </Link>
                </div>
                <p className="text-sm text-ink-muted">
                  {FREE_SCANS} escaneos gratis cada {SCAN_WINDOW_HOURS} horas · Sin tarjeta
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              {reduce ? (
                <PhoneMock />
              ) : (
                <m.div
                  initial={{ y: 24, rotate: 2 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.9, delay: 0.15 }}
                >
                  <PhoneMock />
                </m.div>
              )}
            </div>
          </div>
        </section>

        {/* Alérgenos cubiertos */}
        <section className="bg-ink text-ground" aria-labelledby="alergenos-title">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-12 sm:px-10">
            <p id="alergenos-title" className="text-[15px] font-semibold text-sage">
              Detecta los 14 alérgenos de declaración obligatoria, incluida la lactosa, y las trazas de “puede contener”
            </p>
            <ul className="flex flex-wrap gap-2.5">
              {ALLERGENS.map((a) => (
                <li key={a} className="rounded-full px-3.5 py-2 text-sm ring-1 ring-[#2E4A39]">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="mx-auto flex max-w-[1200px] scroll-mt-20 flex-col gap-12 px-5 py-20 sm:px-10 sm:pt-28 sm:pb-24">
          <Reveal className="flex max-w-[640px] flex-col gap-3.5">
            <Eyebrow>Cómo funciona</Eyebrow>
            <SectionTitle>Tres pasos, en el pasillo del súper.</SectionTitle>
          </Reveal>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal
                key={s.title}
                as="li"
                delay={i * 0.08}
                className="flex h-full flex-col gap-4 rounded-[28px] bg-white p-8 ring-1 ring-[#E3E7DD]"
              >
                  <span className="font-display text-[56px] leading-none font-extrabold text-[#CFE3D4]" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="text-[22px] font-bold">{s.title}</h3>
                  <p className="leading-relaxed text-ink-soft">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Semáforo */}
        <section id="semaforo" className="scroll-mt-20 border-y border-[#E3E7DD] bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-5 py-20 sm:px-10 sm:py-[104px]">
            <Reveal className="flex max-w-[680px] flex-col gap-3.5">
              <Eyebrow>El semáforo</Eyebrow>
              <SectionTitle>Una respuesta clara. Nunca un “seguro” a ciegas.</SectionTitle>
              <p className="text-lg leading-relaxed text-ink-soft">
                Si la foto no se puede leer, te lo decimos en lugar de adivinar.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATES.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.06}>
                  <div className={`flex h-full flex-col gap-3 rounded-3xl p-6 ring-2 ring-inset ${s.box}`}>
                    <span className={`flex size-11 items-center justify-center rounded-[14px] bg-white ${s.icon}`}>
                      <s.Icon className="size-[22px]" />
                    </span>
                    <h3 className={`text-[19px] font-bold ${s.heading}`}>{s.title}</h3>
                    <p className={`text-[15px] leading-relaxed ${s.body}`}>{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Por qué food+ */}
        <section className="mx-auto flex max-w-[1200px] flex-col gap-12 px-5 py-20 sm:px-10 sm:pt-28 sm:pb-[104px]">
          <Reveal>
            <SectionTitle className="max-w-[700px]">Hecho para leer lo que tú no alcanzas a leer.</SectionTitle>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08} className="flex flex-col gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-mint text-brand-700">
                  <f.Icon className="size-6" />
                </span>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="leading-relaxed text-ink-soft">{f.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="scroll-mt-20 bg-[#E9EFE5]">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-12 px-5 py-20 sm:px-10 sm:py-[104px]">
            <Reveal className="flex max-w-[620px] flex-col gap-3.5 text-center">
              <Eyebrow>Precios</Eyebrow>
              <SectionTitle>Gratis todos los días. Premium si no quieres esperar.</SectionTitle>
            </Reveal>
            <div className="grid w-full max-w-[880px] gap-6 md:grid-cols-2">
              <Reveal>
                <div className="flex h-full flex-col gap-5 rounded-[32px] bg-white p-8 ring-1 ring-line sm:p-9">
                  <div>
                    <h3 className="text-[22px] font-bold">Gratis</h3>
                    <p className="mt-1.5 text-[15px] text-ink-soft">Para tus compras de cada día</p>
                  </div>
                  <p className="font-display text-[52px] font-extrabold tracking-[-0.03em]">$0</p>
                  <ul className="flex flex-col gap-3 text-ink-soft">
                    {[
                      `${FREE_SCANS} escaneos o búsquedas cada ${SCAN_WINDOW_HOURS} horas`,
                      'Se recargan solos, con cuenta regresiva',
                      'Todas tus alergias en el perfil',
                      'Sin tarjeta',
                    ].map((b) => (
                      <li key={b} className="flex items-center gap-2.5">
                        <CheckIcon className="size-[18px] shrink-0 text-brand-700" strokeWidth={3} /> {b}
                      </li>
                    ))}
                  </ul>
                  <Link to="/registro" className={`${ctaLight} mt-auto min-h-[52px] font-bold ring-[1.5px] ring-ink`}>
                    Empieza gratis
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="flex h-full flex-col gap-5 rounded-[32px] bg-ink p-8 text-ground sm:p-9">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[22px] font-bold">Premium</h3>
                      <p className="mt-1.5 text-[15px] text-sage">Para cada compra</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[13px] font-bold text-amber-900">
                      Muy pronto
                    </span>
                  </div>
                  <p className="font-display text-[52px] font-extrabold tracking-[-0.03em]">
                    {PREMIUM_PRICE_LABEL.replace(' MXN', '')}{' '}
                    <span className="font-sans text-[17px] font-medium tracking-normal text-sage">MXN / mes</span>
                  </p>
                  <ul className="flex flex-col gap-3 text-[#DDE7DF]">
                    {['Escaneos de ingredientes ilimitados', 'Búsquedas por nombre ilimitadas', 'Sin esperar recargas', 'Cancela cuando quieras'].map(
                      (b) => (
                        <li key={b} className="flex items-center gap-2.5">
                          <CheckIcon className="size-[18px] shrink-0 text-green-400" strokeWidth={3} /> {b}
                        </li>
                      ),
                    )}
                  </ul>
                  <Link to="/registro" className={`${btnPrimary} mt-auto min-h-[52px] font-bold`}>
                    Crear cuenta
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section id="preguntas" className="mx-auto flex max-w-[860px] scroll-mt-20 flex-col gap-8 px-5 py-20 sm:px-10 sm:pt-28 sm:pb-24">
          <Reveal>
            <SectionTitle>Preguntas frecuentes</SectionTitle>
          </Reveal>
          <div className="border-b border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-t border-line">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold sm:text-[19px] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-xl text-ink-soft ring-1 ring-line transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-6 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Llamado final */}
        <section className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-10 sm:pb-[104px]">
          <Reveal>
            <div className="flex flex-col items-center gap-6 rounded-[40px] bg-brand-700 px-6 py-14 text-center text-white sm:px-12 sm:py-[72px]">
              <h2 className="max-w-[720px] font-display text-[38px] leading-[1.04] font-extrabold tracking-[-0.03em] sm:text-[52px]">
                Tu próxima compra, sin dudas.
              </h2>
              <p className="max-w-[520px] text-lg leading-relaxed text-[#E3F5E8]">
                Crea tu cuenta, configura tus alergias y escanea tu primer producto en menos de un minuto.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/registro"
                  className="inline-flex min-h-14 items-center rounded-2xl bg-white px-7 text-[17px] font-bold text-ink transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-lg hover:shadow-ink/25 active:translate-y-0 active:scale-95"
                >
                  Empieza gratis
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-14 items-center rounded-2xl px-6 text-[17px] font-semibold text-white ring-[1.5px] ring-white/70 transition-[transform,background-color] duration-150 hover:bg-white/10 active:scale-95"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-ink-muted sm:px-10">
          <Logo className="text-xl text-ink" />
          <span>Herramienta orientativa basada en el texto de la etiqueta. Verifica siempre el envase.</span>
          <span>© 2024 food+. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
