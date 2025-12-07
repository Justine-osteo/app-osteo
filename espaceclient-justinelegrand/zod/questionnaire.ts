// zod/questionnaire.ts
import { z } from 'zod'

export const QuestionnaireSchema = z.object({
    id: z.string().uuid(),
    seance_id: z.string().uuid(),
    type: z.string(),
    reponses: z.any()
})

export const QuestionnaireInsertSchema = QuestionnaireSchema.partial({ id: true })
export const QuestionnaireUpdateSchema = QuestionnaireInsertSchema.partial()

export type Questionnaire = z.infer<typeof QuestionnaireSchema>
export type QuestionnaireInsert = z.infer<typeof QuestionnaireInsertSchema>
export type QuestionnaireUpdate = z.infer<typeof QuestionnaireUpdateSchema>
