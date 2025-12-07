import { z } from 'zod'

export const AnimalSchema = z.object({
    activite: z.string().nullable(),
    antecedents: z.string().nullable(),
    archive: z.boolean().nullable(),
    client_id: z.string(),
    date_naissance: z.string().nullable(),
    espece: z.string().nullable(),
    id: z.string(),
    modification_en_attente: z.boolean(),
    nom: z.string(),
    notes_admin: z.string().nullable(),
    photo_url: z.string().nullable(),
    poids: z.number().nullable(),
    race: z.string().nullable(),
    remarques: z.string().nullable(),
    sexe: z.string().nullable(),
    sterilise: z.boolean().nullable(),
})

export const AnimalInsertSchema = AnimalSchema.partial({
    id: true,
    antecedents: true,
    archive: true,
    date_naissance: true,
    espece: true,
    race: true,
    sexe: true,
    sterilise: true,
    poids: true,
    remarques: true,
    notes_admin: true,
    photo_url: true,
    modification_en_attente: true,
    activite: true
})

export const AnimalUpdateSchema = AnimalInsertSchema.partial()

export const AnimalResumeSchema = z.object({
    id: z.string().uuid(),
    nom: z.string()
})

export const AnimalResumeArraySchema = z.array(AnimalResumeSchema)

export type Animal = z.infer<typeof AnimalSchema>
export type AnimalInsert = z.infer<typeof AnimalInsertSchema>
export type AnimalUpdate = z.infer<typeof AnimalUpdateSchema>
export type AnimalResume = z.infer<typeof AnimalResumeSchema>
