import { z } from 'zod';

export const userSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    email: z.string().email("Email invalide"),
    age: z.number().min(0).optional(),
});

// Type TypeScript généré automatiquement à partir du schéma :
export type User = z.infer<typeof userSchema>;
