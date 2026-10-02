import type { UserProfile } from '../types/api.ts';

export function FreemiumCounter({ user }: { user: UserProfile }) {
  if (user.plan === 'PREMIUM' || user.scanLimit === null || user.scansRemaining === null) {
    return (
      <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
        Premium · ilimitado
      </span>
    );
  }

  const { scansRemaining: remaining, scanLimit: limit } = user;
  const tone =
    remaining === 0
      ? { text: 'text-red-700', bar: 'bg-red-500', ring: 'ring-red-200 bg-red-50' }
      : remaining <= 1
        ? { text: 'text-amber-700', bar: 'bg-amber-500', ring: 'ring-amber-200 bg-amber-50' }
        : { text: 'text-slate-700', bar: 'bg-brand-500', ring: 'ring-slate-200 bg-white' };

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl px-3 py-1.5 ring-1 ${tone.ring}`}
      aria-label={`Te quedan ${remaining} de ${limit} escaneos gratuitos`}
    >
      <span className={`text-xs font-semibold whitespace-nowrap ${tone.text}`}>
        Escaneos gratuitos: {remaining}/{limit}
      </span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${limit > 0 ? (remaining / limit) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
