import { createServerSupabase } from '@/lib/supabase/server'
import FicheAnimalClient from '@/components/admin/FicheAnimalClient'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Cette page est un composant serveur
export default async function FicheAnimalPage({ params }: { params: { id: string } }) {
    // 1. On initialise et on force le typage du client immédiatement
    // Cela évite d'avoir à mettre des 'as any' sur chaque requête plus bas
    const supabase = (await createServerSupabase()) as unknown as SupabaseClient<Database>

    const { id: animalId } = params

    // 2. Récupérer les détails de l'animal
    const { data: animal, error: animalError } = await supabase
        .from('animaux')
        .select('*, clients(*)')
        .eq('id', animalId)
        .single()

    // 3. Récupérer l'historique complet des séances
    const { data: seances, error: seancesError } = await supabase
        .from('seances')
        .select('*')
        .eq('animal_id', animalId)
        .order('date', { ascending: false })

    if (animalError || !animal) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">Impossible de trouver cet animal.</p>
                <Link href="/admin/animaux" className="text-blue-600 hover:underline mt-4 inline-block">
                    Retour à la liste des animaux
                </Link>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Link href="/admin/animaux" className="flex items-center text-[#6E4B42] hover:underline mb-4 font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste
            </Link>
            <TitrePrincipal>Fiche de {animal.nom}</TitrePrincipal>
            <FicheAnimalClient
                initialAnimal={animal}
                initialSeances={seances || []}
            />
        </div>
    )
}