import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from '../lib/authCookies.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';
import { getUserId } from '../middlewares/requireAuth.js';
import { getProfile } from '../services/user.service.js';

const refreshCookie = (req: Request): string | undefined => {
  const v: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof v === 'string' ? v : undefined;
};

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const { user, tokens } = await authService.register(input);
  setAuthCookies(res, tokens);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(input);
  setAuthCookies(res, tokens);
  res.json({ user });
}

export async function refresh(req: Request, res: Response) {
  try {
    const { user, tokens } = await authService.refresh(refreshCookie(req));
    setAuthCookies(res, tokens);
    res.json({ user });
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logout(refreshCookie(req));
  clearAuthCookies(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  res.json({ user: await getProfile(getUserId(req)) });
}
