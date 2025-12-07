// zod/client.ts
import { z } from 'zod'

export const ClientSchema = z.object({
    id: z.string().uuid(),
    auth_id: z.string(),
    nom: z.string(),
    email: z.string().email(),
    archive: z.boolean().nullable(),
    couleur_preferee: z.string().nullable(),
    created_at: z.string().nullable(),
    is_admin: z.boolean().nullable(),
    telephone: z.string().nullable(),
    adresse: z.string().nullable(),
})

export const ClientInsertSchema = ClientSchema.partial({
    id: true,
    archive: true,
    couleur_preferee: true,
    created_at: true,
    is_admin: true
})

export const ClientUpdateSchema = ClientInsertSchema.partial()

export type Client = z.infer<typeof ClientSchema>
export type ClientInsert = z.infer<typeof ClientInsertSchema>
export type ClientUpdate = z.infer<typeof ClientUpdateSchema>