import type { ComponentType, SVGProps } from 'react';
import type { SafetyStatus } from '../types/api.ts';
import { AlertTriangleIcon, HelpCircleIcon, ShieldCheckIcon } from './icons.tsx';

interface SafetyStyle {
  title: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Contenedor de la tarjeta */
  card: string;
  /** Texto e íconos */
  text: string;
  /** Punto de color para listas */
  dot: string;
}

// Semáforo de seguridad. Las clases se escriben completas para que Tailwind las detecte.
export const SAFETY_STYLES: Record<SafetyStatus, SafetyStyle> = {
  SAFE: {
    title: 'Seguro para ti',
    Icon: ShieldCheckIcon,
    card: 'border-green-200 bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  DANGER: {
    title: 'Peligroso para ti',
    Icon: AlertTriangleIcon,
    card: 'border-red-200 bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  CAUTION: {
    title: 'Precaución: puede contener trazas',
    Icon: AlertTriangleIcon,
    card: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  UNKNOWN: {
    title: 'Sin datos suficientes',
    Icon: HelpCircleIcon,
    card: 'border-slate-200 bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};
