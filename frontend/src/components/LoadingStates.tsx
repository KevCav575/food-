import { Spinner } from './icons.tsx';

/** Skeleton con la misma forma que ProductResultCard, mientras se analiza el producto */
export function ProductResultSkeleton() {
  return (
    <div role="status" aria-live="polite" className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <span className="sr-only">Analizando producto…</span>
      <div className="flex animate-pulse gap-4 p-4">
        <div className="size-24 shrink-0 rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mx-4 flex animate-pulse items-center gap-3 rounded-2xl bg-slate-100 p-4">
        <Spinner className="size-6 text-brand-600" />
        <div className="text-sm font-medium text-slate-600">Analizando ingredientes…</div>
      </div>
      <div className="animate-pulse space-y-2 p-4">
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-11/12 rounded bg-slate-200" />
        <div className="h-3 w-4/5 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Buscando productos…</span>
      <ul className="space-y-2">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <div className="size-14 shrink-0 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-200" />
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
}
