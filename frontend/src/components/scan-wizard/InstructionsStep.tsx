import { useRef } from 'react';
import { PhotoCameraIcon, FocusIcon, GalleryIcon, SunIcon, TextScanIcon } from '../icons.tsx';
import { btnPrimary, btnSecondary } from '../ui/buttons.ts';

interface Props {
  onOpenCamera: () => void;
  onPickFile: (file: File) => void;
}

const TIPS = [
  { Icon: SunIcon, title: 'Buena luz', text: 'Evita sombras y reflejos sobre el empaque.' },
  { Icon: FocusIcon, title: 'Enfoca de cerca', text: 'Que las letras se vean nítidas, sin movimiento.' },
  { Icon: TextScanIcon, title: 'Solo los ingredientes', text: 'Encuadra la lista completa dentro del marco.' },
];

export function InstructionsStep({ onOpenCamera, onPickFile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section aria-labelledby="instructions-title" className="space-y-5">
      {/* Ilustración: un empaque con la lista de ingredientes enmarcada */}
      <div className="relative mx-auto flex h-32 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 to-emerald-100">
        <div className="relative h-24 w-20 rotate-[-4deg] rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
          <div className="mb-2 h-2 w-12 rounded bg-slate-300" />
          <div className="space-y-1.5 rounded-md p-1.5 ring-2 ring-brand-500 ring-offset-2">
            {[100, 85, 95, 70].map((w, i) => (
              <div key={i} className="h-1 rounded bg-slate-300" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div className="absolute right-[28%] bottom-4 flex size-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
          <TextScanIcon className="size-6" />
        </div>
      </div>

      <div className="text-center">
        <h2 id="instructions-title" className="text-xl font-bold text-slate-900">
          Toma una foto de los ingredientes
        </h2>
        <p className="mt-1 text-slate-600">Asegúrate de tener buena luz. Te diremos al instante si es seguro para ti.</p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onOpenCamera}
          className={`${btnPrimary} min-h-14 w-full text-lg`}
        >
          <PhotoCameraIcon className="size-6" /> Abrir cámara
        </button>

        {/* Alternativa: galería o cámara nativa del teléfono (mejor autofocus en algunos equipos) */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`${btnSecondary} min-h-12 w-full`}
        >
          <GalleryIcon className="size-5" /> Subir una foto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // permite volver a elegir el mismo archivo
            if (file) onPickFile(file);
          }}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-500">Consejos para una buena foto</h3>
        <ul className="space-y-2">
          {TIPS.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-slate-200">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">{title}</span>
                <span className="block text-sm text-slate-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
