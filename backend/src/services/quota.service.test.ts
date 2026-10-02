import { describe, expect, it } from 'vitest';
import { quotaState } from './quota.service.js';
import { env } from '../config/env.js';

const H = 60 * 60 * 1000;
const now = new Date('2026-10-02T12:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms);
const LIMIT = env.FREE_SCAN_LIMIT;
const WINDOW = env.SCAN_WINDOW_HOURS * H;

describe('quotaState', () => {
  it('sin tanda iniciada: cupo completo y sin hora de recarga', () => {
    expect(quotaState({ plan: 'FREE', scanCount: 0, scanWindowStart: null }, now)).toEqual({
      remaining: LIMIT,
      resetsAt: null,
    });
  });

  it('tanda en curso: descuenta y calcula la recarga desde el primer escaneo', () => {
    const start = ago(1 * H);
    expect(quotaState({ plan: 'FREE', scanCount: 2, scanWindowStart: start }, now)).toEqual({
      remaining: LIMIT - 2,
      resetsAt: new Date(start.getTime() + WINDOW),
    });
  });

  it('agotado dentro de la tanda: 0 restantes', () => {
    expect(quotaState({ plan: 'FREE', scanCount: LIMIT, scanWindowStart: ago(WINDOW - 1000) }, now).remaining).toBe(0);
  });

  it('tanda vencida: se considera recargada aunque el contador siga lleno', () => {
    expect(quotaState({ plan: 'FREE', scanCount: LIMIT, scanWindowStart: ago(WINDOW) }, now)).toEqual({
      remaining: LIMIT,
      resetsAt: null,
    });
  });

  it('cuentas anteriores al cambio (contador sin fecha de inicio) también se recargan', () => {
    expect(quotaState({ plan: 'FREE', scanCount: LIMIT, scanWindowStart: null }, now).remaining).toBe(LIMIT);
  });

  it('Premium: ilimitado', () => {
    expect(quotaState({ plan: 'PREMIUM', scanCount: 99, scanWindowStart: ago(H) }, now)).toEqual({
      remaining: null,
      resetsAt: null,
    });
  });
});
