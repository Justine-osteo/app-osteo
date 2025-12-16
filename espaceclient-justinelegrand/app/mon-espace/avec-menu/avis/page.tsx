'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { Star, Menu, X, PawPrint, FileText, ArrowLeft } from 'lucide-react'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type AnimalResume = {
    id: string
    nom: string
}

export default function AvisPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [animaux, setAnimaux] = useState<AnimalResume[]>([])
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const googleReviewLink = 'https://g.page/r/CYs2l3SR3FeLEBE/review'

    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data: clientData } = await supabaseTyped
                .from('clients')
                .select('id')
                .eq('auth_id', user.id)
                .single()

            if (!clientData) {
                setLoading(false)
                return
            }

            const { data: animauxData } = await supabaseTyped
                .from('animaux')
                .select('id, nom')
                .eq('client_id', clientData.id)

            setAnimaux(animauxData || [])
            setLoading(false)
        }
        fetchData()
    }, [supabaseTyped])

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Veuillez sélectionner une note.')
            return
        }
        setSubmitting(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

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

        const { error: insertError } = await supabaseTyped
            .from('avis')
            .insert({
                client_id: clientData.id,
                note: rating,
            })

        if (insertError) {
            console.error(insertError)
            setError("Erreur lors de l'envoi de l'avis.")
            setSubmitting(false)
        } else {
            setSuccess(true)
            window.open(googleReviewLink, '_blank', 'noopener,noreferrer')
            setSubmitting(false)
        }
    }

    if (loading) return <EcranDeChargement texte="Chargement..." />

    // --- CONTENU DU MENU (Sidebar Desktop & Pop-up Mobile) ---
    const MenuContent = () => (
        <>
            <div className="flex items-center gap-2 mb-6 text-[#B05F63] justify-center md:justify-start">
                <div className="p-2 bg-white rounded-full border border-[#F3D8DD] shadow-sm">
                    <PawPrint className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-charm font-bold">Mes dossiers</h2>
            </div>

            <ul className="space-y-3 mb-8">
                {animaux.map((a) => (
                    <li key={a.id}>
                        <Link
                            href={`/mon-espace/avec-menu/animal/${a.id}`}
                            className="block p-3 text-[#6E4B42] hover:bg-white hover:text-[#B05F63] rounded-lg transition-all border border-transparent hover:border-[#F3D8DD]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {a.nom}
                        </Link>
                    </li>
                ))}
                {animaux.length === 0 && (
                    <li className="text-sm text-gray-500 italic p-2">Aucun animal enregistré</li>
                )}
            </ul>

            <div className="border-t border-[#F3D8DD] my-6"></div>

            <div className="space-y-3">
                <Link
                    href="/mon-espace/avec-menu/factures"
                    className="flex items-center gap-3 text-[#6E4B42] hover:text-[#B05F63] transition font-medium p-2 rounded-lg hover:bg-white/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <FileText className="w-5 h-5" /> Mes factures
                </Link>
                {/* Lien Actif pour Avis */}
                <div className="bg-white border-l-4 border-[#B05F63] p-2 rounded-r-lg shadow-sm flex items-center gap-3 text-[#B05F63] font-bold">
                    <Star className="w-5 h-5" /> Laisser un avis
                </div>
            </div>
        </>
    )

    return (
        <div className="min-h-screen bg-[#FFF0F3] p-4 sm:p-6 font-sans text-[#6E4B42]">

            {/* --- NAVIGATION MOBILE --- */}
            <div className="md:hidden flex justify-between items-center mb-4">
                <button
                    onClick={() => router.push('/mon-espace')}
                    className="flex items-center text-[#6E4B42] font-semibold bg-white px-4 py-2 rounded-xl border border-[#F3D8DD] shadow-sm hover:bg-[#FBEAEC] transition text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </button>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex items-center gap-2 bg-[#FBEAEC] text-[#B05F63] px-4 py-2 rounded-xl border border-[#F3D8DD] font-bold shadow-sm active:scale-95 transition text-sm"
                >
                    <Menu className="w-5 h-5" /> Menu
                </button>
            </div>

            <div className="flex max-w-7xl mx-auto gap-6">

                {/* --- SIDEBAR DESKTOP --- */}
                <aside className="hidden md:block w-1/4 bg-[#FBEAEC] rounded-2xl p-6 shadow-sm h-fit border-2 border-[#F3D8DD] sticky top-6">
                    <button
                        onClick={() => router.push('/mon-espace')}
                        className="flex items-center text-[#6E4B42] hover:text-[#B05F63] font-semibold mb-8 transition-colors group"
                    >
                        <div className="bg-white p-1.5 rounded-full border border-[#F3D8DD] mr-2 group-hover:border-[#B05F63] transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Retour à l'accueil
                    </button>
                    <MenuContent />
                </aside>

                {/* --- MODALE MOBILE (POP-UP) --- */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
                        <div className="bg-[#FBEAEC] w-full max-w-sm rounded-2xl p-6 relative shadow-xl border-2 border-[#F3D8DD] animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-4 right-4 text-[#6E4B42] hover:bg-white/50 p-2 rounded-full transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <MenuContent />
                        </div>
                    </div>
                )}

                {/* --- CONTENU PRINCIPAL --- */}
                <main className="flex-1 space-y-6">
                    <TitrePrincipal>Partager votre expérience</TitrePrincipal>

                    {success ? (
                        <div className="mt-6 bg-green-100 border border-green-400 text-green-800 p-8 rounded-lg shadow text-center space-y-4 animate-fadeIn">
                            <h2 className="text-xl font-charm text-center font-bold">Merci, votre note a bien été enregistrée !</h2>
                            <p>La page des avis Google s'est ouverte dans un nouvel onglet pour vous permettre de finaliser votre commentaire public.</p>
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-[#F3D8DD] text-[#6E4B42] p-6 md:p-10 rounded-2xl shadow-sm space-y-8">
                            <div>
                                <label className="block font-semibold mb-4 text-xl text-center font-charm text-[#B05F63]">
                                    Quelle note donneriez-vous à votre dernière expérience ?
                                </label>
                                <div className="flex items-center justify-center gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className="w-12 h-12 cursor-pointer transition-transform hover:scale-110"
                                            fill={(hoverRating || rating) >= star ? '#FFC107' : 'none'}
                                            stroke={(hoverRating || rating) >= star ? '#FFC107' : '#E5E7EB'}
                                            strokeWidth={1.5}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#FFF5F7] p-4 rounded-xl border border-[#F3D8DD]">
                                <p className="text-sm text-center text-gray-500 italic">
                                    Après avoir validé votre note ci-dessus, vous serez redirigé vers Google pour écrire un commentaire détaillé si vous le souhaitez.
                                </p>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || rating === 0}
                                className="w-full bg-[#B05F63] text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-[#8E3E42] transition shadow-lg hover:-translate-y-1 duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            >
                                {submitting ? 'Envoi en cours...' : 'Valider et laisser un avis sur Google'}
                            </button>
                            {error && <p className="text-red-600 text-center font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}