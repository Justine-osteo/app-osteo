// zod/document.ts
import { z } from 'zod'

export const DocumentSchema = z.object({
    id: z.string().uuid(),
    nom: z.string(),
    categorie: z.string(),
    url: z.string().url(),
    seance_id: z.string().uuid().nullable(),
    animal_id: z.string().uuid().nullable(),
    client_id: z.string().uuid().nullable()
})

export const DocumentInsertSchema = DocumentSchema.partial({
    id: true
})

export const DocumentUpdateSchema = DocumentInsertSchema.partial()

export type Document = z.infer<typeof DocumentSchema>
export type DocumentInsert = z.infer<typeof DocumentInsertSchema>
export type DocumentUpdate = z.infer<typeof DocumentUpdateSchema>
