// zod/modifications_animaux.ts
import { z } from 'zod'

export const ModificationsAnimauxSchema = z.object({
    id: z.string().uuid(),
    animal_id: z.string().uuid(),
    client_id: z.string().uuid(),
    donnees: z.any(),
    statut: z.string(),
    photo_url: z.string().url().nullable(),
    cree_le: z.string().nullable(),
    traite_le: z.string().nullable()
})

export const ModificationsAnimauxInsertSchema = ModificationsAnimauxSchema.partial({
    id: true,
    cree_le: true,
    traite_le: true,
    statut: true,
    photo_url: true
})

export const ModificationsAnimauxUpdateSchema = ModificationsAnimauxInsertSchema.partial()

export type ModificationsAnimaux = z.infer<typeof ModificationsAnimauxSchema>
export type ModificationsAnimauxInsert = z.infer<typeof ModificationsAnimauxInsertSchema>
export type ModificationsAnimauxUpdate = z.infer<typeof ModificationsAnimauxUpdateSchema>