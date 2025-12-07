'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import type { Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

type AnimalBase = Database['public']['Tables']['animaux']['Row']

type Animal = AnimalBase & {
    clients: {
        nom: string
        email: string
        telephone?: string | null
        adresse?: string | null
    }
}

export default function FicheAnimalAdmin() {
    const router = useRouter()
    const params = useParams()
    const id = Array.isArray(params.id) ? params.id[0] : params.id

    const [animal, setAnimal] = useState<Animal | null>(null)
    const [loading, setLoading] = useState(true)
    const [remarques, setRemarques] = useState<string>('')

    // CORRECTION : On force le typage du client
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const fetchAnimal = async () => {
            // Utilisation du client typé
            const { data, error } = await supabaseTyped
                .from('animaux')
                .select('*, clients (nom, email, telephone, adresse)')
                .eq('id', id!)
                .single()

            if (error) {
                console.error('Erreur chargement animal :', error)
            } else {
                // On cast data pour correspondre au type Animal étendu avec clients
                setAnimal(data as unknown as Animal)
                setRemarques(data?.remarques ?? '')
            }
            setLoading(false)
        }

        if (id) fetchAnimal()
    }, [id, supabaseTyped])

    const handleRemarquesUpdate = async () => {
        if (!id) return

        // Utilisation du client typé pour l'update
        const { error } = await supabaseTyped
            .from('animaux')
            .update({ remarques })
            .eq('id', id)

        if (error) console.error('Erreur lors de la mise à jour des remarques :', error)
    }

    if (loading) return <p className="p-6">Chargement...</p>
    if (!animal) return <p className="p-6">Animal introuvable</p>

    return (
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-5xl mx-auto">

            {/* Boutons de navigation admin */}
            <div className="md:col-span-3 flex justify-end gap-4 mb-2">
                <button
                    onClick={() => router.push(`/admin/animaux/${id}/modifier`)}
                    className="px-4 py-2 rounded bg-[#B05F63] text-white hover:bg-[#6E4B42] transition"
                >
                    ✏️ Modifier la fiche
                </button>
                <button
                    onClick={() => router.push(`/admin/animaux/${id}/osteopathie/liste`)}
                    className="px-4 py-2 rounded bg-[#B05F63] text-white hover:bg-[#6E4B42] transition"
                >
                    🦴 Ostéopathie
                </button>
                <button
                    onClick={() => router.push(`/admin/animaux/${id}/nutrition`)}
                    className="px-4 py-2 rounded bg-[#B05F63] text-white hover:bg-[#6E4B42] transition"
                >
                    🍗 Nutrition
                </button>
            </div>

            {/* Colonne infos animal */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow">
                <TitrePrincipal>{animal.nom ?? 'Nom inconnu'}</TitrePrincipal>
                <div className="mt-4 space-y-2">
                    <p><strong>Espèce :</strong> {animal.espece ?? '–'}</p>
                    <p><strong>Race :</strong> {animal.race ?? '–'}</p>
                    <p><strong>Sexe :</strong> {animal.sexe ?? '–'}</p>
                    {animal.date_naissance && <p><strong>Naissance :</strong> {animal.date_naissance}</p>}
                    <p><strong>Stérilisé :</strong> {animal.sterilise ? 'Oui' : 'Non'}</p>
                    {animal.activite && <p><strong>Activité :</strong> {animal.activite}</p>}
                    {animal.antecedents && <p><strong>Antécédents :</strong> {animal.antecedents}</p>}
                </div>

                <div className="mt-6">
                    <label htmlFor="remarques" className="block text-sm font-semibold text-[#6E4B42] mb-1">
                        Remarques internes
                    </label>
                    <textarea
                        id="remarques"
                        value={remarques}
                        onChange={(e) => setRemarques(e.target.value)}
                        onBlur={handleRemarquesUpdate}
                        rows={4}
                        className="w-full border border-[#B05F63] rounded p-2"
                        placeholder="Ajouter des remarques internes (admin uniquement)..."
                    />
                </div>
            </div>

            {/* Colonne infos client */}
            <div className="bg-[#F3D8DD] p-4 rounded-2xl shadow space-y-2">
                <h2 className="font-charm text-xl text-[#6E4B42] mb-2">Informations du client</h2>
                <p><strong>Nom :</strong> {animal.clients.nom}</p>
                <p><strong>Email :</strong> {animal.clients.email}</p>
                {animal.clients.telephone && <p><strong>Téléphone :</strong> {animal.clients.telephone}</p>}
                {animal.clients.adresse && <p><strong>Adresse :</strong> {animal.clients.adresse}</p>}
            </div>
        </main>
    )
}