import { z } from 'zod';
export const AvisSchema = z.object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    seanceId: z.string().uuid(),
    visible: z.boolean(),
    lienFormulaire: z.string().url(),
});
