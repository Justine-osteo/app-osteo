'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
// MODIFICATION 1: On importe le composant d'animation
import EcranDeChargement from '@/components/ui/EcranDeChargement'

type Seance = {
    id: string
    date: string
}

export default function DossierOsteopathie() {
    const params = useParams()
    const animalId = Array.isArray(params.id) ? params.id[0] : params.id
    const router = useRouter()
    const [seances, setSeances] = useState<Seance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!animalId) return

        const fetchSeances = async () => {
            const { data, error } = await supabase
                .from('seances')
                .select('id, date')
                .eq('animal_id', animalId)
                .eq('type', 'osteopathie')
                .order('date', { ascending: false })

            if (error) {
                console.error('Erreur chargement séances :', error)
            } else {
                setSeances(data)
            }

            setLoading(false)
        }

        fetchSeances()
    }, [animalId])

    // MODIFICATION 2: On remplace le simple texte par notre composant d'animation
    if (loading) {
        return <EcranDeChargement texte="Chargement des séances..." />
    }

    return (
        <main className="max-w-3xl mx-auto p-6">
            <button
                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animalId}`)}
                className="flex items-center text-[#6E4B42] hover:underline mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la fiche de l’animal
            </button>

            <TitrePrincipal>Dossier ostéopathie</TitrePrincipal>

            {seances.length === 0 ? (
                <p className="text-center mt-6">Aucune séance enregistrée pour cet animal.</p>
            ) : (
                <div className="space-y-4 mt-6">
                    {seances.map((seance) => (
                        <button
                            key={seance.id}
                            onClick={() =>
                                router.push(
                                    `/mon-espace/avec-menu/animal/${animalId}/osteopathie/${seance.id}`
                                )
                            }
                            className="w-full text-left bg-white border border-[#B05F63] text-[#6E4B42] p-4 rounded shadow hover:bg-[#FBEAEC] transition"
                        >
                            {format(new Date(seance.date), 'dd MMMM yyyy', { locale: fr })}
                        </button>
                    ))}
                </div>
            )}
        </main>
    )
}

