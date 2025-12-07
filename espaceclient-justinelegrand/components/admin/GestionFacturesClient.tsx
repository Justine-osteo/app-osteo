'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, UploadCloud, Loader, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Client = { id: string; nom: string }
type Animal = { nom: string; clients: Client | null }
type Seance = {
    id: string
    date: string
    type: string | null
    motif: string | null
    animaux: Animal | null
}

interface Props {
    initialSeances: Seance[]
    initialFacturesExistantes: Set<string | null>
}

export default function GestionFacturesClient({ initialSeances, initialFacturesExistantes }: Props) {
    const [seances] = useState(initialSeances)
    const [facturesExistantes, setFacturesExistantes] = useState(initialFacturesExistantes)
    const [uploadingId, setUploadingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [filterDate, setFilterDate] = useState('')

    const filteredSeances = useMemo(() => {
        return seances.filter(seance => {
            const clientName = seance.animaux?.clients?.nom.toLowerCase() || ''
            const animalName = seance.animaux?.nom.toLowerCase() || ''
            const searchLower = searchTerm.toLowerCase()

            const matchesSearch =
                clientName.includes(searchLower) || animalName.includes(searchLower)

            const matchesDate = !filterDate || seance.date.startsWith(filterDate)

            return matchesSearch && matchesDate
        })
    }, [seances, searchTerm, filterDate])

    const facturesAFaireCount = filteredSeances.filter(
        s => !facturesExistantes.has(s.id)
    ).length

    // --- UPLOAD (Via API) ---
    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        seance: Seance
    ) => {
        const file = e.target.files?.[0]
        if (!file || !seance.animaux?.clients) return

        setUploadingId(seance.id)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('seance_id', seance.id)
        formData.append('client_id', seance.animaux.clients.id)
        formData.append('original_name', file.name)

        try {
            const res = await fetch('/api/factures/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Erreur lors de l'envoi du fichier.")
                setUploadingId(null)
                return
            }

            // Mise à jour locale
            setFacturesExistantes(prev => new Set(prev).add(seance.id))
        } catch (err) {
            console.error(err)
            setError("Erreur de connexion serveur.")
        } finally {
            setUploadingId(null)
        }
    }

    // --- DELETE (Direct Client avec RLS Admin) ---
    const handleDelete = async (seanceId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette facture ? Le fichier sera effacé définitivement.")) return;

        setDeletingId(seanceId);
        setError(null);

        try {
            // 1. Récupérer l'URL du fichier pour pouvoir le supprimer du Storage
            // On utilise 'as any' pour contourner les erreurs TS habituelles
            const { data: factureData, error: fetchError } = await (supabase
                .from('factures') as any)
                .select('url_fichier')
                .eq('seance_id', seanceId)
                .single();

            if (fetchError) throw new Error("Impossible de trouver la facture.");

            // 2. Supprimer le fichier du Storage
            if (factureData?.url_fichier) {
                // L'URL est du type : .../factures/CLIENT_ID/UUID-NOM.pdf
                // On a besoin du chemin relatif : CLIENT_ID/UUID-NOM.pdf
                const path = factureData.url_fichier.split('/factures/')[1];
                if (path) {
                    const { error: storageError } = await supabase.storage
                        .from('factures')
                        .remove([path]);

                    if (storageError) console.warn("Erreur suppression fichier storage (peut-être déjà absent):", storageError);
                }
            }

            // 3. Supprimer la ligne en Base de Données
            const { error: deleteError } = await (supabase
                .from('factures') as any)
                .delete()
                .eq('seance_id', seanceId);

            if (deleteError) throw deleteError;

            // 4. Mettre à jour l'interface (Retirer l'ID du Set)
            setFacturesExistantes(prev => {
                const newSet = new Set(prev);
                newSet.delete(seanceId);
                return newSet;
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erreur lors de la suppression.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="mt-4">
            {/* Filtres */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rechercher par nom
                        </label>
                        <input
                            type="text"
                            placeholder="Nom du client ou de l'animal..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B05F63] focus:ring-1 focus:ring-[#B05F63] outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrer par date
                        </label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B05F63] focus:ring-1 focus:ring-[#B05F63] outline-none"
                        />
                    </div>
                </div>

                <div className="text-center bg-amber-50 text-amber-800 font-medium p-3 rounded-md border border-amber-200">
                    {facturesAFaireCount} facture
                    {facturesAFaireCount > 1 ? 's' : ''} à générer pour la sélection
                    actuelle.
                </div>
            </div>

            {error && (
                <p className="p-3 bg-red-100 text-red-700 rounded-md mb-4 border border-red-200">
                    {error}
                </p>
            )}

            {/* Liste */}
            <div className="space-y-3">
                {filteredSeances.map(seance => (
                    <div
                        key={seance.id}
                        className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap justify-between items-center gap-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex-1 min-w-[250px]">
                            <p className="font-bold text-lg text-[#6E4B42]">
                                {seance.animaux?.nom}
                            </p>
                            <p className="text-sm text-gray-600">
                                Client :{' '}
                                <span className="font-medium">
                                    {seance.animaux?.clients?.nom || 'N/A'}
                                </span>
                            </p>
                            <p className="text-sm text-gray-500">
                                Séance du{' '}
                                {new Date(seance.date).toLocaleDateString('fr-FR', {
                                    dateStyle: 'long',
                                })}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {facturesExistantes.has(seance.id) ? (
                                <div className="flex items-center gap-3 animate-fadeIn">
                                    <span className="flex items-center gap-2 text-green-700 font-semibold py-1.5 px-3 rounded-full bg-green-100 text-sm border border-green-200">
                                        <CheckCircle className="w-4 h-4" />
                                        Facture envoyée
                                    </span>

                                    {/* BOUTON SUPPRIMER */}
                                    <button
                                        onClick={() => handleDelete(seance.id)}
                                        disabled={!!deletingId}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Supprimer la facture (permet de la remplacer)"
                                    >
                                        {deletingId === seance.id ? (
                                            <Loader className="w-5 h-5 animate-spin text-red-600" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="flex items-center gap-2 text-red-700 font-semibold py-1.5 px-3 rounded-full bg-red-100 text-sm border border-red-200">
                                        <XCircle className="w-4 h-4" />
                                        En attente
                                    </span>

                                    <label
                                        className={`relative cursor-pointer ${uploadingId
                                            ? 'bg-gray-400'
                                            : 'bg-[#B05F63] hover:bg-[#8E3E42]'
                                            } text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2 shadow-sm`}
                                    >
                                        {uploadingId === seance.id ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <UploadCloud className="w-5 h-5" />
                                        )}
                                        <span>
                                            {uploadingId === seance.id
                                                ? 'Envoi...'
                                                : 'Uploader PDF'}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf"
                                            onChange={e => handleFileUpload(e, seance)}
                                            disabled={!!uploadingId}
                                        />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {filteredSeances.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">
                            Aucune séance ne correspond à vos critères de recherche.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}