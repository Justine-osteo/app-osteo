import { createServerSupabase } from '@/lib/supabase/server'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import GestionFacturesClient from '@/components/admin/GestionFacturesClient'

// Définition des types pour le Server Component
type ClientData = { id: string; nom: string }
type AnimalData = { nom: string; clients: ClientData | null }
export type SeanceData = {
    id: string
    date: string
    type: string | null
    motif: string | null
    animaux: AnimalData | null
}
type FactureData = { seance_id: string | null }

export default async function PageFacturesAdmin() {
    // 1. Initialisation standard (plus de casting complexe ici qui crée des références circulaires)
    const supabase = await createServerSupabase()

    // On récupère toutes les séances passées qui ne sont pas archivées
    // 2. CORRECTION : On caste le résultat de .from() en 'any' pour débloquer la chaîne
    const { data: seances, error: seancesError } = await (supabase
        .from('seances') as any)
        .select(`
            id, date, type, motif,
            animaux ( nom, clients ( nom, id ) )
        `)
        .lt('date', new Date().toISOString())
        .order('date', { ascending: false }) as { data: SeanceData[] | null, error: any }

    // On récupère toutes les factures existantes
    // 3. CORRECTION : Idem ici, casting simple et efficace
    const { data: factures, error: facturesError } = await (supabase
        .from('factures') as any)
        .select('seance_id') as { data: FactureData[] | null, error: any }

    if (seancesError || facturesError) {
        console.error(seancesError || facturesError)
        return (
            <p className="p-6 text-red-500">
                Erreur lors du chargement des données.
            </p>
        )
    }

    // On crée un ensemble (Set) des ID de séances déjà facturées
    const facturesExistantes = new Set(
        (factures ?? [])
            .map(f => f.seance_id)
            .filter((id): id is string => Boolean(id))
    )

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <TitrePrincipal>Gestion des factures</TitrePrincipal>
            <p className="text-gray-600 mb-6">
                Voici la liste des séances passées. Vous pouvez téléverser une facture pour celles qui n'en ont pas encore.
            </p>
            <GestionFacturesClient
                initialSeances={(seances ?? [])}
                initialFacturesExistantes={facturesExistantes}
            />
        </div>
    )
}