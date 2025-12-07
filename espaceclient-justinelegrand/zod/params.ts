import { z } from 'zod'

export const AnimalSeanceParamsSchema = z.object({
    id: z.string().uuid(),         // animalId
    seanceId: z.string().uuid(),   // seanceId
})

export const AnimalIdSchema = z.string().uuid()