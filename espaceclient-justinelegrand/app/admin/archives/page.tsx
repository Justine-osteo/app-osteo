'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { ArrowLeft, ArchiveRestore, Loader } from 'lucide-react'
import type { Database } from '@/types/supabase'
// AJOUT POUR LE TYPAGE
import { SupabaseClient } from '@supabase/supabase-js'

type ArchivedAnimal = {
    id: string;
    nom: string;
    clients: { nom: string } | null;
}

export default function ArchivesPage() {
    const router = useRouter()
    const [archivedAnimals, setArchivedAnimals] = useState<ArchivedAnimal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    // CORRECTION : On force le typage du client
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const fetchArchivedAnimals = async () => {
            setLoading(true)

            // Utilisation du client typé
            const { data, error } = await supabaseTyped
                .from('animaux')
                .select(`
                    id, 
                    nom, 
                    clients ( nom )
                `)
                .eq('archive', true)
                .order('nom')

            if (error) {
                console.error(error)
                setError("Impossible de charger les archives.")
            } else {
                // On utilise 'as any' ou un cast précis car le type retourné avec la jointure 
                // peut être légèrement différent de la structure ArchivedAnimal attendue par le state
                setArchivedAnimals(data as unknown as ArchivedAnimal[])
            }
            setLoading(false)
        }
        fetchArchivedAnimals()
    }, [supabaseTyped])

    const handleUnarchive = async (animalId: string) => {
        setProcessingId(animalId)
        setError(null)

        // Utilisation du client typé pour l'update
        const { error } = await supabaseTyped
            .from('animaux')
            .update({ archive: false })
            .eq('id', animalId)

        if (error) {
            setError("Erreur lors de la désarchivage : " + error.message)
        } else {
            // On retire l'animal de la liste affichée
            setArchivedAnimals(prev => prev.filter(animal => animal.id !== animalId))
        }
        setProcessingId(null)
    }

    if (loading) {
        return <EcranDeChargement texte="Chargement des archives..." />
    }

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <button
                onClick={() => router.push('/admin/animaux')}
                className="flex items-center text-[#6E4B42] hover:underline mb-4 font-semibold"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste des animaux
            </button>

            <TitrePrincipal>Animaux Archivés</TitrePrincipal>

            {error && <p className="text-red-600 bg-red-100 p-3 rounded my-4">{error}</p>}

            {archivedAnimals.length === 0 ? (
                <p className="text-gray-600 mt-6 text-center">Aucun animal n'est archivé pour le moment.</p>
            ) : (
                <div className="space-y-3 mt-6">
                    {archivedAnimals.map(animal => (
                        <div key={animal.id} className="bg-white p-4 border rounded-lg shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-gray-500">{animal.nom}</p>
                                <p className="text-sm text-gray-400">Propriétaire : {animal.clients?.nom || 'N/A'}</p>
                            </div>
                            <button
                                onClick={() => handleUnarchive(animal.id)}
                                disabled={!!processingId}
                                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {processingId === animal.id ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArchiveRestore className="w-4 h-4" />
                                )}
                                Désarchiver
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}