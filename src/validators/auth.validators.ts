import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Enter a valid email').max(255),
  // bcrypt truncates beyond 72 bytes
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email').max(255),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
