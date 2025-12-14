'use client'

import { useEffect, useState } from 'react'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { supabase } from '@/lib/supabase/client'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { RefreshCcw, Check, X, AlertCircle } from 'lucide-react'

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

    const fetchModifications = async () => {
        setLoading(true)
        setError(null)
        console.log("🔄 Chargement des modifications...")

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
            console.error("🔴 Erreur Supabase :", error)
            setError("Impossible de charger les demandes (Vérifiez les droits RLS).")
        } else {
            console.log("🟢 Données reçues :", data)
            setModifications(data as Modification[])
        }
        setLoading(false)
    }

    // Chargement initial
    useEffect(() => {
        fetchModifications()
    }, [])

    const handleAction = async (modificationId: string, action: 'approve' | 'reject') => {
        setProcessingId(modificationId)
        setError(null)

        try {
            const response = await fetch('/api/validations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modificationId, action }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Erreur lors du traitement")
            }

            // Succès : on retire l'élément de la liste
            setModifications(prev => prev.filter(mod => mod.id !== modificationId))

        } catch (err: any) {
            console.error("Erreur action :", err)
            setError(err.message || "Une erreur est survenue.")
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return <EcranDeChargement texte="Chargement des validations en attente..." />
    }

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <TitrePrincipal>Validations en attente</TitrePrincipal>
                <button
                    onClick={fetchModifications}
                    className="p-2 text-[#B05F63] hover:bg-[#FBEAEC] rounded-full transition"
                    title="Actualiser la liste"
                >
                    <RefreshCcw className="w-5 h-5" />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {modifications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">Aucune modification en attente.</p>
                    <p className="text-sm text-gray-400 mt-1">Tout est à jour ! 🎉</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {modifications.map(mod => (
                        <div key={mod.id} className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">

                                {/* Info En-tête */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-[#6E4B42]">
                                        {mod.animaux?.nom || 'Animal inconnu'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Client : <span className="font-medium">{mod.clients?.nom || 'Inconnu'}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <RefreshCcw className="w-3 h-3" />
                                        Demandé le {format(new Date(mod.cree_le), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                    </p>
                                </div>

                                {/* Boutons d'action */}
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleAction(mod.id, 'approve')}
                                        disabled={!!processingId}
                                        className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-200 disabled:opacity-50 flex items-center gap-2 transition"
                                    >
                                        {processingId === mod.id ? '...' : <><Check className="w-4 h-4" /> Accepter</>}
                                    </button>
                                    <button
                                        onClick={() => handleAction(mod.id, 'reject')}
                                        disabled={!!processingId}
                                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 disabled:opacity-50 flex items-center gap-2 transition"
                                    >
                                        {processingId === mod.id ? '...' : <><X className="w-4 h-4" /> Refuser</>}
                                    </button>
                                </div>
                            </div>

                            {/* Détail des modifications */}
                            <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    Données proposées
                                </p>
                                <ul className="space-y-2">
                                    {Object.entries(mod.donnees).map(([key, value]) => {
                                        // GESTION SPÉCIFIQUE POUR L'AFFICHAGE DES PHOTOS
                                        if (key === 'photo_url' || key === 'photo') {
                                            return (
                                                <li key={key} className="text-sm flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                                                    <span className="font-medium text-gray-700 capitalize w-32 shrink-0 pt-1">
                                                        {key.replace('_', ' ')}
                                                    </span>
                                                    <span className="hidden sm:inline text-gray-400 pt-1">→</span>
                                                    <div className="flex-1">
                                                        {value ? (
                                                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                                                <img
                                                                    src={String(value)}
                                                                    alt="Nouvelle photo"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-dashed">
                                                                (Problème : valeur null reçue)
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            )
                                        }

                                        // AFFICHAGE STANDARD
                                        return (
                                            <li key={key} className="text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                <span className="font-medium text-gray-700 capitalize w-32 shrink-0">
                                                    {key.replace('_', ' ')}
                                                </span>
                                                <span className="hidden sm:inline text-gray-400">→</span>
                                                <span className="text-[#B05F63] font-semibold break-all">
                                                    {String(value)}
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}