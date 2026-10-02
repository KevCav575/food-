import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rateLimiters.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, auth.register);
authRouter.post('/login', authLimiter, auth.login);
authRouter.post('/refresh', auth.refresh);
authRouter.post('/logout', auth.logout);
authRouter.get('/me', requireAuth, auth.me);
