import { createServerSupabase } from '@/lib/supabase/server'
import FicheAnimalClient from '@/components/admin/FicheAnimalClient'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// MODIFICATION : params est une Promise dans les versions récentes de Next.js
export default async function FicheAnimalPage({ params }: { params: Promise<{ id: string }> }) {
    // 1. On attend que les paramètres soient résolus
    const { id: animalId } = await params

    const supabase = (await createServerSupabase()) as unknown as SupabaseClient<Database>

    console.log(`🔍 [ADMIN] Recherche animal ID: ${animalId}`)

    // 2. Récupérer les détails de l'animal
    const { data: animal, error: animalError } = await supabase
        .from('animaux')
        .select('*, clients(*)')
        .eq('id', animalId)
        .single()

    if (animalError) {
        console.error("🔴 [ADMIN] Erreur récupération animal:", animalError.message)
    }

    // 3. Récupérer l'historique complet des séances
    const { data: seances, error: seancesError } = await supabase
        .from('seances')
        .select('*')
        .eq('animal_id', animalId)
        .order('date', { ascending: false })

    if (animalError || !animal) {
        return (
            <div className="p-6 text-center max-w-2xl mx-auto mt-10 border border-red-200 rounded-lg bg-red-50">
                <p className="text-red-600 font-bold text-lg mb-2">Impossible de trouver cet animal.</p>
                <p className="text-sm text-gray-600 mb-4">
                    Erreur technique : {animalError?.message || "Animal introuvable"}
                </p>
                <Link href="/admin/animaux" className="text-[#B05F63] hover:underline font-semibold">
                    ← Retour à la liste des animaux
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