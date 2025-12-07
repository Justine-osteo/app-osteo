'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

type Client = {
    id: string
    nom: string
    adresse: string | null
    telephone: string | null
    email: string
}

export default function ModifierMesInfosClientPage() {
    const router = useRouter()
    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // On force le typage du client
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        async function fetchClient() {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                router.push('/connexion')
                return
            }

            const { data: clientData, error: clientError } = await supabaseTyped
                .from('clients')
                .select('id, nom, adresse, telephone, email')
                .eq('auth_id', user.id)
                .single()

            if (clientError || !clientData) {
                setError("Client introuvable.")
            } else {
                setClient(clientData as Client)
            }
            setLoading(false)
        }
        fetchClient()
    }, [router, supabaseTyped])

    const handleChange = (field: keyof Client, value: string) => {
        if (!client) return
        setClient({ ...client, [field]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!client) return
        setSaving(true)
        setError(null)
        setSuccessMessage(null)

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("Session expirée, veuillez vous reconnecter.");
            setSaving(false);
            return;
        }

        let emailChanged = false;

        // Étape 1 : Mise à jour de l'Auth (Passeport)
        if (client.email !== user.email) {
            const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/email-confirmed`;
            const { error: emailUpdateError } = await supabase.auth.updateUser(
                { email: client.email },
                { emailRedirectTo: redirectUrl }
            );

            if (emailUpdateError) {
                setError(`Erreur lors de la demande de changement d'email : ${emailUpdateError.message}`);
                setSaving(false);
                return;
            }
            emailChanged = true;
        }

        // Étape 2 : Mise à jour de la table 'clients' (Fiche visuelle)
        const { error: profileUpdateError } = await supabaseTyped
            .from('clients')
            .update({
                nom: client.nom,
                adresse: client.adresse,
                telephone: client.telephone,
                email: client.email
            })
            .eq('id', client.id)

        setSaving(false)

        if (profileUpdateError) {
            setError("Erreur lors de la sauvegarde du profil : " + profileUpdateError.message)
        } else {
            if (emailChanged) {
                setSuccessMessage("Modifications enregistrées. ATTENTION : Pour l'email, veuillez valider le changement en cliquant sur le lien reçu sur votre ANCIENNE et votre NOUVELLE adresse.")
            } else {
                setSuccessMessage('Informations mises à jour avec succès.')
            }
        }
    }

    if (loading) { return <EcranDeChargement texte="Chargement..." /> }
    if (!client) {
        return (
            <main className="max-w-2xl mx-auto p-6 text-center">
                <p className="text-red-600">{error || "Pas de client trouvé."}</p>
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
            <TitrePrincipal>Modifier mes informations</TitrePrincipal>
            <form onSubmit={handleSubmit} className="bg-[#FBEAEC] p-6 rounded shadow space-y-4 mt-4">

                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Nom</label>
                    <input type="text" value={client.nom} onChange={(e) => handleChange('nom', e.target.value)} required className="w-full p-2 border border-[#B05F63] rounded" />
                </div>

                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Adresse</label>
                    <input type="text" value={client.adresse ?? ''} onChange={(e) => handleChange('adresse', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>

                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Téléphone</label>
                    <input type="tel" value={client.telephone ?? ''} onChange={(e) => handleChange('telephone', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>

                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Email</label>
                    <input type="email" value={client.email} onChange={(e) => handleChange('email', e.target.value)} required className="w-full p-2 border border-[#B05F63] rounded" />

                    {/* --- ENCART D'AVERTISSEMENT POUR L'EMAIL --- */}
                    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                        <div className="flex items-center gap-2 mb-2 font-bold text-amber-700">
                            <AlertTriangle className="w-5 h-5" />
                            Important : Changement d'email
                        </div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Pour des raisons de sécurité, vous recevrez un lien de validation sur votre <strong>ancienne</strong> ET votre <strong>nouvelle</strong> adresse.</li>
                            <li>Vous devez cliquer sur <strong>les deux liens</strong> pour que le changement soit effectif pour la connexion.</li>
                            <li className="font-semibold">Si vous n'avez plus accès à votre ancienne boîte mail, ne modifiez pas ce champ et contactez-moi directement : 07 88 56 63 98.</li>
                        </ul>
                    </div>
                </div>

                {successMessage && <p className="text-green-800 bg-green-100 border border-green-200 p-4 rounded text-sm font-medium">{successMessage}</p>}
                {error && <p className="text-red-700 bg-red-100 border border-red-200 p-4 rounded text-sm">{error}</p>}

                <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={() => router.back()} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Retour</button>
                    <button type="submit" disabled={saving} className="bg-[#B05F63] text-white font-semibold px-4 py-2 rounded hover:bg-[#6E4B42] disabled:bg-gray-400">
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </main>
    )
}