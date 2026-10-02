import { api } from './api.ts';
import type { Allergen, AllergenRef, UserProfile } from '../types/api.ts';

export interface AllergenCatalogItem extends AllergenRef {
  aliases: string[];
}

export const getAllergenCatalog = () =>
  api<{ allergens: AllergenCatalogItem[] }>('/allergens').then((r) => r.allergens);

export const updateProfile = (name: string | null) =>
  api<{ user: UserProfile }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }).then((r) => r.user);

export const updateAllergies = (allergies: Allergen[]) =>
  api<{ allergies: AllergenRef[] }>('/users/me/allergies', {
    method: 'PUT',
    body: JSON.stringify({ allergies }),
  }).then((r) => r.allergies);
