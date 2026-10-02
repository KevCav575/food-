import type { Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import { getUserId } from '../middlewares/requireAuth.js';
import { updateAllergiesSchema, updateProfileSchema } from '../validators/user.validators.js';

export async function getProfile(req: Request, res: Response) {
  res.json({ user: await userService.getProfile(getUserId(req)) });
}

export async function updateProfile(req: Request, res: Response) {
  const input = updateProfileSchema.parse(req.body);
  res.json({ user: await userService.updateProfile(getUserId(req), input) });
}

export async function getAllergies(req: Request, res: Response) {
  const { allergies } = await userService.getProfile(getUserId(req));
  res.json({ allergies });
}

export async function updateAllergies(req: Request, res: Response) {
  const allergens = updateAllergiesSchema.parse(req.body);
  const user = await userService.setUserAllergens(getUserId(req), allergens);
  res.json({ allergies: user.allergies });
}
