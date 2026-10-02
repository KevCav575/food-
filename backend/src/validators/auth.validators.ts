import { z } from 'zod';

const email = z.string().trim().toLowerCase().max(255).pipe(z.email('Email inválido'));

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/\d/, 'La contraseña debe incluir al menos un número')
    // bcrypt solo usa los primeros 72 bytes
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'La contraseña es demasiado larga'),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria').max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
