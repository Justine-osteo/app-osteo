'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
// AJOUTS POUR LE TYPAGE
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export default function CreerAnimalPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const clientId = searchParams.get('clientId')

    // Form states
    const [nom, setNom] = useState('')
    const [espece, setEspece] = useState('')
    const [race, setRace] = useState('')
    const [dateNaissance, setDateNaissance] = useState('')
    const [sexe, setSexe] = useState('')
    const [sterilise, setSterilise] = useState(false)
    const [poids, setPoids] = useState<number | ''>('')
    const [activite, setActivite] = useState('')
    const [antecedents, setAntecedents] = useState('')

    // UI states
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // CORRECTION : On force le typage du client
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!clientId) {
            setError('Aucun client sélectionné. Veuillez retourner à la page précédente.')
            return
        }
        if (!nom) {
            setError('Le nom de l\'animal est obligatoire.')
            return
        }

        setSaving(true)
        setError(null)
        setSuccessMessage(null)

        // Utilisation du client typé pour l'insertion
        const { error: insertError } = await supabaseTyped
            .from('animaux')
            .insert({
                client_id: clientId,
                nom,
                espece,
                race,
                date_naissance: dateNaissance || null,
                sexe: sexe || null,
                sterilise,
                poids: poids === '' ? null : poids,
                activite: activite || null,
                antecedents: antecedents || null,
            })

        setSaving(false)

        if (insertError) {
            setError(`Erreur lors de la création de l'animal : ${insertError.message}`)
        } else {
            setSuccessMessage('Animal créé avec succès ! Redirection...')
            setTimeout(() => {
                // Redirect back to the appointment creation page
                router.push('/admin/creer-rdv/creer')
            }, 2000)
        }
    }

    // Affiche une erreur si on arrive sur la page sans ID client
    if (!clientId) {
        return (
            <main className="max-w-2xl mx-auto p-6 text-center">
                <TitrePrincipal>Erreur</TitrePrincipal>
                <p className="mt-4 text-red-600">L'identifiant du client est manquant. Veuillez retourner à la page de création de rendez-vous et sélectionner un client avant d'ajouter un animal.</p>
                <button onClick={() => router.push('/admin/creer-rdv/creer')} className="mt-4 bg-[#B05F63] text-white font-semibold px-4 py-2 rounded hover:bg-[#6E4B42]">
                    Retour
                </button>
            </main>
        )
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

            <TitrePrincipal>Ajouter un nouvel animal</TitrePrincipal>

            <form onSubmit={handleSubmit} className="mt-6 bg-[#FBEAEC] p-8 rounded-lg shadow-md space-y-4">
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Nom</label>
                    <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Espèce (chien, chat, cheval...)</label>
                    <input type="text" value={espece} onChange={(e) => setEspece(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Race</label>
                    <input type="text" value={race} onChange={(e) => setRace(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Date de naissance</label>
                    <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Sexe</label>
                    <select value={sexe} onChange={(e) => setSexe(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded bg-white">
                        <option value="">-- Non spécifié --</option>
                        <option value="Mâle">Mâle</option>
                        <option value="Femelle">Femelle</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <label className="font-semibold text-[#6E4B42]">Stérilisé(e)</label>
                    <input type="checkbox" checked={sterilise} onChange={(e) => setSterilise(e.target.checked)} className="h-5 w-5 accent-[#B05F63]" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Poids (kg)</label>
                    <input type="number" step="0.1" value={poids} onChange={(e) => setPoids(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Activité</label>
                    <input type="text" value={activite} onChange={(e) => setActivite(e.target.value)} placeholder="Ex: Compétition, loisir, chasse..." className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Antécédents médicaux</label>
                    <textarea value={antecedents} onChange={(e) => setAntecedents(e.target.value)} rows={3} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving} className="bg-[#B05F63] text-white font-semibold px-6 py-2 rounded hover:bg-[#6E4B42] transition disabled:bg-gray-400">
                        {saving ? 'Création en cours...' : 'Enregistrer'}
                    </button>
                </div>

                {error && <p className="text-red-600 text-center font-semibold mt-4">{error}</p>}
                {successMessage && <p className="text-green-600 text-center font-semibold mt-4">{successMessage}</p>}
            </form>
        </main>
    )
}