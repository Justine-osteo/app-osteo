import { z } from 'zod'

export const TypeSeanceEnum = z.enum(['ostéopathie', 'nutrition'])
export type TypeSeance = z.infer<typeof TypeSeanceEnum>
