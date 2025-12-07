'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Animal = Database['public']['Tables']['animaux']['Row']
type Seance = Database['public']['Tables']['seances']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface ProchainRDV {
    animal: Animal
    seance: Seance
    client: Client
}

export default function ProchainsRDV() {
    const [loading, setLoading] = useState(true)
    const [prochainsRDV, setProchainsRDV] = useState<ProchainRDV[]>([])
    const router = useRouter()

    useEffect(() => {
        const fetchProchainsRDV = async () => {
            const { data: seances, error } = await supabase
                .from('seances')
                .select(`
          *,
          animaux (
            *,
            clients (*)
          )
        `)
                .gte('date', new Date().toISOString())
                .order('date', { ascending: true })
                .limit(5)

            if (error) {
                console.error('Erreur fetch prochains RDV:', error)
                setProchainsRDV([])
            } else if (seances) {
                const rdvList: ProchainRDV[] = seances.map((seance: any) => ({
                    seance,
                    animal: seance.animaux,
                    client: seance.animaux?.clients,
                }))
                setProchainsRDV(rdvList)
            }
            setLoading(false)
        }

        fetchProchainsRDV()
    }, [])

    const getIconForEspece = (espece: string | null) => {
        switch (espece?.toLowerCase()) {
            case 'chien':
                return '🐶'
            case 'chat':
                return '🐱'
            case 'cheval':
                return '🐴'
            default:
                return '🐾'
        }
    }

    const handleClick = (seance: Seance, animal: Animal) => {
        if (seance.type === 'osteopathie') {
            router.push(`/admin/animaux/${animal.id}/osteopathie/${seance.id}`)
        } else if (seance.type === 'nutrition') {
            router.push(`/admin/animaux/${animal.id}/nutrition/${seance.id}`)
        } else {
            router.push(`/admin/animaux/${animal.id}`)
        }
    }

    if (loading) {
        return <p className="text-center text-[#6E4B42]">Chargement des prochains rendez-vous...</p>
    }

    if (prochainsRDV.length === 0) {
        return <p className="text-[#6E4B42]">Aucun rendez-vous à venir.</p>
    }

    return (
        <ul className="space-y-3 text-[#6E4B42]">
            {prochainsRDV.map(({ animal, seance, client }) => (
                <button
                    key={seance.id}
                    onClick={() => handleClick(seance, animal)}
                    className="w-full text-left border border-[#B05F63] rounded p-3 bg-white shadow-sm hover:bg-[#F3D8DD] transition cursor-pointer"
                    aria-label={`Voir séance ${seance.type} de ${animal.nom} le ${new Date(
                        seance.date
                    ).toLocaleDateString('fr-FR')}`}
                >
                    <span className="text-2xl mr-2">{getIconForEspece(animal.espece)}</span>
                    <strong>{animal.nom}</strong> —{' '}
                    <time dateTime={seance.date}>
                        {new Date(seance.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })}{' '}
                        à{' '}
                        {new Date(seance.date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </time>
                    <br />
                    Propriétaire : {client?.nom || 'N/A'} <br />
                    Motif : {seance.motif || 'non précisé'}
                </button>
            ))}
        </ul>
    )
}
