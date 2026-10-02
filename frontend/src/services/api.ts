// Cliente HTTP base. `credentials: 'include'` envía las cookies HttpOnly de sesión.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

// Rutas en las que un 401 es una respuesta legítima y no debe disparar un refresh
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshing: Promise<boolean> | null = null;

/** Renueva la sesión una sola vez aunque fallen varias peticiones en paralelo. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}, canRetry = true): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      // Con FormData el navegador pone el Content-Type multipart (con su boundary) por sí solo
      ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  // El access token dura 15 min: si expiró, se renueva con el refresh token y se reintenta
  if (res.status === 401 && canRetry && !NO_REFRESH.includes(path) && (await refreshSession())) {
    return api<T>(path, init, false);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? res.statusText, data?.code, data?.details);
  }
  return data as T;
}
