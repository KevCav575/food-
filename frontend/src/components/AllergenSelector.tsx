import type { Allergen } from '../types/api.ts';
import type { AllergenCatalogItem } from '../services/profile.ts';
import { ALLERGEN_META, ALLERGEN_ORDER } from './allergenMeta.ts';
import { CheckIcon } from './icons.tsx';

interface Props {
  catalog: AllergenCatalogItem[];
  selected: ReadonlySet<Allergen>;
  onToggle: (allergen: Allergen) => void;
  disabled?: boolean;
}

export function AllergenSelector({ catalog, selected, onToggle, disabled }: Props) {
  const byKey = new Map(catalog.map((c) => [c.allergen, c]));
  // Respeta el orden de presentación y añade al final cualquier alérgeno nuevo del backend
  const items = [
    ...ALLERGEN_ORDER.filter((a) => byKey.has(a)),
    ...catalog.map((c) => c.allergen).filter((a) => !ALLERGEN_META[a]),
  ];

  return (
    <ul className="grid grid-cols-2 gap-2.5" aria-label="Alérgenos">
      {items.map((allergen) => {
        const item = byKey.get(allergen)!;
        const meta = ALLERGEN_META[allergen] ?? { emoji: '⚠️', hint: '' };
        const isOn = selected.has(allergen);

        return (
          <li key={allergen}>
            <button
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggle(allergen)}
              disabled={disabled}
              className={`relative flex h-full min-h-24 w-full flex-col items-start gap-1 rounded-2xl p-3 text-left transition select-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60 ${
                isOn
                  ? 'bg-red-50 ring-2 ring-red-500'
                  : 'bg-white ring-1 ring-slate-200 hover:ring-slate-300'
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {meta.emoji}
              </span>
              <span className={`text-sm leading-tight font-semibold ${isOn ? 'text-red-800' : 'text-slate-900'}`}>
                {item.label}
              </span>
              {meta.hint && (
                <span className={`text-xs leading-snug ${isOn ? 'text-red-700/80' : 'text-slate-500'}`}>
                  {meta.hint}
                </span>
              )}
              <span
                aria-hidden="true"
                className={`absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full transition ${
                  isOn ? 'bg-red-600 text-white' : 'bg-slate-100 text-transparent ring-1 ring-slate-200'
                }`}
              >
                <CheckIcon className="size-3.5" strokeWidth={3} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
