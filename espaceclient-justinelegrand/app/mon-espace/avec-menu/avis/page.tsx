'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import MenuLateralClient from '@/components/ui/MenuLateralClient'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { Star } from 'lucide-react'
// AJOUTS POUR LE TYPAGE
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type AnimalResume = {
    id: string
    nom: string
}

export default function AvisPage() {
    const [loading, setLoading] = useState(true)
    const [animaux, setAnimaux] = useState<AnimalResume[]>([])
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const googleReviewLink = 'https://g.page/r/CYs2l3SR3FeLEBE/review'

    // CORRECTION : On force le typage du client ici
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Utilisation de supabaseTyped pour accéder aux types de la table 'clients'
            const { data: clientData } = await supabaseTyped
                .from('clients')
                .select('id')
                .eq('auth_id', user.id)
                .single()

            if (!clientData) {
                setLoading(false)
                return
            }

            // Utilisation de supabaseTyped pour la table 'animaux'
            const { data: animauxData } = await supabaseTyped
                .from('animaux')
                .select('id, nom')
                .eq('client_id', clientData.id)

            setAnimaux(animauxData || [])
            setLoading(false)
        }
        fetchData()
    }, [supabaseTyped]) // Ajout de la dépendance (optionnel mais propre)

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Veuillez sélectionner une note.')
            return
        }
        setSubmitting(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        // On récupère l'ID client proprement
        const { data: clientData } = await supabaseTyped
            .from('clients')
            .select('id')
            .eq('auth_id', user!.id)
            .single()

        if (!clientData) {
            setError("Erreur : Impossible de retrouver votre fiche client.")
            setSubmitting(false)
            return
        }

        // Insertion avec typage correct (plus d'erreur sur 'avis')
        const { error: insertError } = await supabaseTyped
            .from('avis')
            .insert({
                client_id: clientData.id,
                note: rating,
                // Assurez-vous que la colonne 'commentaire' est optionnelle en base si vous ne l'envoyez pas
            })

        if (insertError) {
            console.error(insertError)
            setError("Erreur lors de l'envoi de l'avis.")
            setSubmitting(false)
        } else {
            setSuccess(true)
            // On ouvre Google dans un nouvel onglet
            window.open(googleReviewLink, '_blank', 'noopener,noreferrer')
            setSubmitting(false)
        }
    }

    if (loading) return <EcranDeChargement texte="Chargement..." />

    return (
        <div className="flex flex-col md:flex-row max-w-7xl mx-auto p-6 gap-6">
            <MenuLateralClient animaux={animaux} />
            <main className="flex-1">
                <TitrePrincipal>Partager votre expérience</TitrePrincipal>

                {success ? (
                    <div className="mt-6 bg-green-100 border border-green-400 text-green-800 p-8 rounded-lg shadow text-center space-y-4 animate-fadeIn">
                        <h2 className="text-xl font-charm text-center font-bold">Merci, votre note a bien été enregistrée !</h2>
                        <p>La page des avis Google s'est ouverte dans un nouvel onglet pour vous permettre de finaliser votre commentaire public.</p>
                    </div>
                ) : (
                    <div className="mt-6 bg-white border border-[#B05F63] text-[#6E4B42] p-8 rounded-lg shadow space-y-6">
                        <div>
                            <label className="block font-semibold mb-2 text-lg text-center">Quelle note donneriez-vous à votre dernière expérience ?</label>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className="w-10 h-10 cursor-pointer transition-transform hover:scale-110"
                                        fill={(hoverRating || rating) >= star ? '#FFC107' : 'none'}
                                        stroke={(hoverRating || rating) >= star ? '#FFC107' : '#6E4B42'}
                                        strokeWidth={1.5}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    />
                                ))}
                            </div>
                        </div>

                        <p className="text-sm text-center text-gray-500 pt-2 italic">
                            Après avoir validé votre note, vous serez redirigé vers Google pour finaliser votre avis public.
                        </p>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || rating === 0}
                            className="w-full bg-[#B05F63] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#8E3E42] transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Envoi en cours...' : 'Valider et laisser un avis sur Google'}
                        </button>
                        {error && <p className="text-red-600 text-center font-medium bg-red-50 p-2 rounded">{error}</p>}
                    </div>
                )}
            </main>
        </div>
    )
}