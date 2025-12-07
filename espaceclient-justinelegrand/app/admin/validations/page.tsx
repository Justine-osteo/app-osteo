'use client'

import { useEffect, useState } from 'react'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { supabase } from '@/lib/supabase/client'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Modification = {
    id: string;
    cree_le: string;
    donnees: Record<string, any>;
    animaux: { nom: string } | null;
    clients: { nom: string } | null;
}

export default function ValidationsPage() {
    const [modifications, setModifications] = useState<Modification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchModifications = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('modifications_animaux')
                .select(`
                    id,
                    cree_le,
                    donnees,
                    animaux ( nom ),
                    clients ( nom )
                `)
                .eq('statut', 'en_attente')
                .order('cree_le', { ascending: true })

            if (error) {
                console.error(error)
                setError("Impossible de charger les demandes de modification.")
            } else {
                setModifications(data as Modification[])
            }
            setLoading(false)
        }
        fetchModifications()
    }, [])

    const handleAction = async (modificationId: string, action: 'approve' | 'reject') => {
        setProcessingId(modificationId)
        setError(null)

        const response = await fetch('/api/validations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modificationId, action }),
        })

        if (response.ok) {
            // Si l'action réussit, on retire la modification de la liste dans l'interface
            setModifications(prev => prev.filter(mod => mod.id !== modificationId))
        } else {
            const { error } = await response.json()
            setError(error || "Une erreur est survenue lors du traitement de la demande.")
        }
        setProcessingId(null)
    }

    if (loading) {
        return <EcranDeChargement texte="Chargement des validations en attente..." />
    }

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <TitrePrincipal>Modifications en attente de validation</TitrePrincipal>

            {error && <p className="text-red-600 bg-red-100 p-3 rounded my-4">{error}</p>}

            {modifications.length === 0 ? (
                <p className="text-gray-600 mt-6 text-center">Aucune demande de modification en attente.</p>
            ) : (
                <div className="space-y-4 mt-6">
                    {modifications.map(mod => (
                        <div key={mod.id} className="bg-white p-4 border rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg text-[#6E4B42]">{mod.animaux?.nom}</p>
                                    <p className="text-sm text-gray-500">Propriétaire : {mod.clients?.nom}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Demandé le {format(new Date(mod.cree_le), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(mod.id, 'approve')}
                                        disabled={!!processingId}
                                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-400"
                                    >
                                        {processingId === mod.id ? '...' : 'Accepter'}
                                    </button>
                                    <button
                                        onClick={() => handleAction(mod.id, 'reject')}
                                        disabled={!!processingId}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:bg-gray-400"
                                    >
                                        {processingId === mod.id ? '...' : 'Refuser'}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 border-t pt-3">
                                <p className="font-semibold text-sm mb-2">Données proposées :</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {Object.entries(mod.donnees).map(([key, value]) => (
                                        <li key={key}>
                                            <span className="font-medium capitalize">{key.replace('_', ' ')} :</span> {String(value)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}