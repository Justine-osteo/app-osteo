import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// On crée un client Supabase "Admin" qui a tous les droits
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

export async function POST(request: Request) {
    const { modificationId, action } = await request.json()

    if (!modificationId || !action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    // Étape 1 : Récupérer les informations de la modification demandée
    const { data: modification, error: fetchError } = await supabaseAdmin
        .from('modifications_animaux')
        .select('animal_id, donnees')
        .eq('id', modificationId)
        .single()

    if (fetchError || !modification) {
        return NextResponse.json({ error: "Demande de modification introuvable." }, { status: 404 })
    }

    // Étape 2 : Si on approuve, on met à jour la fiche de l'animal
    if (action === 'approve') {
        const { animal_id, donnees } = modification

        const { error: updateAnimalError } = await supabaseAdmin
            .from('animaux')
            .update(donnees)
            .eq('id', animal_id)

        if (updateAnimalError) {
            console.error(updateAnimalError)
            return NextResponse.json({ error: "Erreur lors de la mise à jour de la fiche de l'animal." }, { status: 500 })
        }
    }

    // Étape 3 : Mettre à jour le statut de la demande de modification (approuvée ou refusée)
    const newStatus = action === 'approve' ? 'accepte' : 'refuse'
    const { error: updateStatusError } = await supabaseAdmin
        .from('modifications_animaux')
        .update({ statut: newStatus, traite_le: new Date().toISOString() })
        .eq('id', modificationId)

    if (updateStatusError) {
        console.error(updateStatusError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour du statut de la demande." }, { status: 500 })
    }

    return NextResponse.json({ message: `Action '${action}' effectuée avec succès.` }, { status: 200 })
}