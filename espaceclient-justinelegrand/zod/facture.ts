// zod/facture.ts
import { z } from 'zod'

export const FactureSchema = z.object({
    id: z.string().uuid(),
    client_id: z.string().uuid(),
    date_emission: z.string(),
    montant: z.number(),
    seance_id: z.string().uuid()
})

export const FactureInsertSchema = FactureSchema.partial({ id: true })
export const FactureUpdateSchema = FactureInsertSchema.partial()

export type Facture = z.infer<typeof FactureSchema>
export type FactureInsert = z.infer<typeof FactureInsertSchema>
export type FactureUpdate = z.infer<typeof FactureUpdateSchema>