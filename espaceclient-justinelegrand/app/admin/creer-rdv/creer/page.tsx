'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { ArrowLeft, PlusCircle } from 'lucide-react'
// AJOUT POUR LE TYPAGE
import { SupabaseClient } from '@supabase/supabase-js'

type Client = Database['public']['Tables']['clients']['Row']
type Animal = Database['public']['Tables']['animaux']['Row']

export default function CreerRendezVousPage() {
    const router = useRouter()

    // Data states
    const [clients, setClients] = useState<Client[]>([])
    const [animaux, setAnimaux] = useState<Animal[]>([])

    // Form states
    const [selectedClientId, setSelectedClientId] = useState('')
    const [selectedAnimalId, setSelectedAnimalId] = useState('')
    const [dateRdv, setDateRdv] = useState('')
    const [typeRdv, setTypeRdv] = useState('osteopathie')
    const [motifRdv, setMotifRdv] = useState('')

    // UI states
    const [loadingClients, setLoadingClients] = useState(true)
    const [loadingAnimaux, setLoadingAnimaux] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // CORRECTION : On force le typage du client
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    // Fetch all non-archived clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            setLoadingClients(true)
            // Utilisation du client typé
            const { data, error } = await supabaseTyped
                .from('clients')
                .select('*')
                .eq('archive', false)
                .order('nom')

            if (data) {
                setClients(data)
            } else {
                console.error("Erreur chargement clients:", error)
            }
            setLoadingClients(false)
        }
        fetchClients()
    }, [supabaseTyped])

    // Fetch non-archived animals when a client is selected
    useEffect(() => {
        if (!selectedClientId) {
            setAnimaux([])
            setSelectedAnimalId('')
            return
        }

        const fetchAnimaux = async () => {
            setLoadingAnimaux(true)
            // Utilisation du client typé
            const { data, error } = await supabaseTyped
                .from('animaux')
                .select('*')
                .eq('client_id', selectedClientId)
                .eq('archive', false)
                .order('nom')

            if (data) {
                setAnimaux(data)
            } else {
                console.error("Erreur chargement animaux:", error)
            }
            setLoadingAnimaux(false)
        }
        fetchAnimaux()
    }, [selectedClientId, supabaseTyped])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAnimalId || !dateRdv) {
            setError("Veuillez sélectionner un animal et une date.")
            return
        }

        setSaving(true)
        setError(null)
        setSuccessMessage(null)

        // Utilisation du client typé pour l'insertion
        const { error: insertError } = await supabaseTyped
            .from('seances')
            .insert({
                animal_id: selectedAnimalId,
                date: dateRdv,
                type: typeRdv as 'osteopathie' | 'nutrition', // 'nutrition' n'est peut-être pas dans l'enum DB, à vérifier, mais TS l'accepte si string
                motif: motifRdv
            })

        setSaving(false)

        if (insertError) {
            setError(`Erreur lors de la création du rendez-vous : ${insertError.message}`)
        } else {
            setSuccessMessage("Rendez-vous créé avec succès ! Redirection vers le tableau de bord...")
            setTimeout(() => {
                router.push('/admin/dashboard')
            }, 2000)
        }
    }

    return (
        <main className="max-w-2xl mx-auto p-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-[#6E4B42] hover:underline mb-4 font-semibold"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
            </button>
            <TitrePrincipal>Créer un nouveau rendez-vous</TitrePrincipal>
            <form onSubmit={handleSubmit} className="mt-6 bg-[#FBEAEC] p-8 rounded-lg shadow-md space-y-6">

                {/* --- Section Client --- */}
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">1. Sélectionner un client</label>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="flex-grow p-2 border border-[#B05F63] rounded bg-white"
                            disabled={loadingClients}
                        >
                            <option value="">{loadingClients ? 'Chargement...' : '-- Choisissez un client --'}</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.nom}</option>
                            ))}
                        </select>
                        <Link href="/admin/clients/creer" className="flex-shrink-0 bg-white text-[#6E4B42] border border-[#B05F63] font-semibold p-2 rounded hover:bg-[#B05F63] hover:text-white transition">
                            <PlusCircle className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* --- Section Animal (conditional) --- */}
                {selectedClientId && (
                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">2. Sélectionner un animal</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedAnimalId}
                                onChange={(e) => setSelectedAnimalId(e.target.value)}
                                className="flex-grow p-2 border border-[#B05F63] rounded bg-white"
                                disabled={loadingAnimaux || animaux.length === 0}
                            >
                                <option value="">{loadingAnimaux ? 'Chargement...' : (animaux.length === 0 ? 'Aucun animal pour ce client' : '-- Choisissez un animal --')}</option>
                                {animaux.map(animal => (
                                    <option key={animal.id} value={animal.id}>{animal.nom}</option>
                                ))}
                            </select>
                            <Link href={`/admin/animaux/creer?clientId=${selectedClientId}`} className="flex-shrink-0 bg-white text-[#6E4B42] border border-[#B05F63] font-semibold p-2 rounded hover:bg-[#B05F63] hover:text-white transition">
                                <PlusCircle className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* --- Section RDV Details (conditional) --- */}
                {selectedAnimalId && (
                    <>
                        <div>
                            <label className="block font-semibold text-[#6E4B42] mb-1">3. Informations du rendez-vous</label>
                            <input
                                type="datetime-local"
                                value={dateRdv}
                                onChange={(e) => setDateRdv(e.target.value)}
                                required
                                className="w-full p-2 border border-[#B05F63] rounded"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-[#6E4B42] mb-1">Type de séance</label>
                            <select value={typeRdv} onChange={(e) => setTypeRdv(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded bg-white">
                                <option value="osteopathie">Ostéopathie</option>
                                <option value="nutrition">Nutrition</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold text-[#6E4B42] mb-1">Motif</label>
                            <textarea
                                value={motifRdv}
                                onChange={(e) => setMotifRdv(e.target.value)}
                                rows={2}
                                placeholder="Facultatif"
                                className="w-full p-2 border border-[#B05F63] rounded"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#B05F63] text-white font-semibold px-6 py-2 rounded hover:bg-[#6E4B42] transition disabled:bg-gray-400"
                            >
                                {saving ? 'Création en cours...' : 'Enregistrer le rendez-vous'}
                            </button>
                        </div>
                    </>
                )}

                {error && <p className="text-red-600 text-center font-semibold mt-4">{error}</p>}
                {successMessage && <p className="text-green-600 text-center font-semibold mt-4">{successMessage}</p>}
            </form>
        </main>
    )
}