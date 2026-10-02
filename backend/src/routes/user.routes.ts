import { Router } from 'express';
import * as user from '../controllers/user.controller.js';

// Montado en /api/users/me detrás de requireAuth
export const userRouter = Router();

userRouter.get('/', user.getProfile);
userRouter.patch('/', user.updateProfile);
userRouter.get('/allergies', user.getAllergies);
userRouter.put('/allergies', user.updateAllergies);
