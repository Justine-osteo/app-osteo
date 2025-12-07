import { z } from 'zod';
export const CompteRenduSchema = z.object({
    id: z.string().uuid(),
    seanceId: z.string().uuid(),
    contenu: z.string(),
    fichierPdfUrl: z.string().url(),
});
