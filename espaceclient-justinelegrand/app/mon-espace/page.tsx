'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Lottie from 'lottie-react'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import SousTitre from '@/components/ui/SousTitre'
import CarteItem from '@/components/CarteItem'
import type { User } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { MapPin, Phone, Mail, LogOut, Edit3, FileText, Star } from 'lucide-react'

// --- Interfaces ---
interface Animal {
    id: string
    nom: string
    photo_url?: string | null
}

interface Client {
    id: string
    nom: string
    adresse: string | null
    telephone: string | null
    email: string
}

// --- Composant Ecran de Chargement ---
function EcranDeChargement({ animationData }: { animationData: any }) {
    return (
        <main
            style={{
                height: '100vh',
                backgroundColor: '#ffffff', // Fond blanc épuré
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                color: '#4B5563', // Gris foncé
                fontFamily: 'Charm, cursive',
            }}
        >
            <div style={{ width: 300, height: 300 }}>
                {animationData && <Lottie animationData={animationData} loop autoplay />}
            </div>
            <p style={{ fontWeight: '600', color: '#B05F63' }}>Chargement de l'espace personnel...</p>
        </main>
    )
}

export default function EspaceClientPage() {
    const [user, setUser] = useState<User | null>(null)
    const [animaux, setAnimaux] = useState<Animal[]>([])
    const [client, setClient] = useState<Client | null>(null)

    // On gère un seul état de chargement global pour la page
    const [loading, setLoading] = useState(true)
    const [animationData, setAnimationData] = useState<any>(null)
    const router = useRouter()

    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const initPage = async () => {
            try {
                // 1. Chargement Lottie
                const lottiePromise = fetch('/lottie/chien-chargement.json')
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null);

                // 2. Auth User
                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (userError || !user) {
                    router.push('/connexion')
                    return
                }
                setUser(user)

                // 3. Client Data
                const clientPromise = supabaseTyped
                    .from('clients')
                    .select('id, nom, adresse, telephone, email')
                    .eq('auth_id', user.id)
                    .single();

                const { data: clientData, error: clientError } = await clientPromise;

                if (clientError || !clientData) {
                    console.error('Client introuvable', clientError)
                } else {
                    setClient(clientData as Client)

                    // 4. Animaux Data
                    const { data: animauxData } = await supabaseTyped
                        .from('animaux')
                        .select('id, nom, photo_url')
                        .eq('client_id', clientData.id);

                    if (animauxData) setAnimaux(animauxData);
                }

                const lottieResult = await lottiePromise;
                if (lottieResult) setAnimationData(lottieResult);

            } catch (error) {
                console.error("Erreur générale:", error);
            } finally {
                setLoading(false)
            }
        }

        initPage()
    }, [router, supabaseTyped])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/connexion')
    }

    if (loading) {
        return <EcranDeChargement animationData={animationData} />
    }

    return (
        // Fond de page gris très léger pour faire ressortir les éléments blancs
        <main className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">

            {/* Colonne latérale : Fond blanc, texte gris, bordure subtile */}
            <aside className="w-full md:w-1/4 bg-white text-gray-600 rounded-xl p-6 space-y-4 shadow-sm border border-gray-200 h-fit">
                <h2 className="text-xl font-charm mb-2 text-[#B05F63] font-bold">Mes informations</h2>
                {client ? (
                    <div className="text-sm space-y-2">
                        <p className="font-semibold text-gray-800 text-lg">{client.nom}</p>
                        <p className="flex items-center gap-2">
                            <span className="text-[#B05F63] opacity-60">📍</span> {client.adresse || 'Adresse non renseignée'}
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-[#B05F63] opacity-60">📞</span> {client.telephone || 'Non renseigné'}
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-[#B05F63] opacity-60">✉️</span> {client.email}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">Informations client non trouvées.</p>
                )}

                {/* Bouton Modifier : Style Outline Rose */}
                <button
                    onClick={() => router.push('/mon-espace/modifier')}
                    className="mt-6 w-full bg-white border border-[#B05F63] hover:bg-rose-50 text-[#B05F63] text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Edit3 className="w-4 h-4" /> Modifier
                </button>

                <hr className="border-t border-gray-200 my-4" />

                {/* Bouton Déconnexion : Gris neutre */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
            </aside>

            {/* Contenu principal */}
            <div className="flex-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 text-[#B05F63]">
                    <TitrePrincipal>Bienvenue dans l'espace personnel</TitrePrincipal>
                </div>

                <section className="mt-6">
                    <div className="mb-4 pl-1 text-gray-700">
                        <SousTitre>Mes animaux</SousTitre>
                    </div>

                    {animaux.length === 0 && (
                        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
                            <p className="text-gray-500">Aucun animal enregistré.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {animaux.map((animal) => (
                            <CarteItem
                                key={animal.id}
                                titre={animal.nom}
                                imageUrl={animal.photo_url}
                                fallback="Pas de photo"
                                boutonTexte="Voir le dossier"
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}`)}
                                className="h-[280px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-12">
                    <div className="mb-4 pl-1 text-gray-700">
                        <SousTitre>Autres actions</SousTitre>
                    </div>
                    {/* MODIFICATION : Boutons classiques (Style Rose & Gris) */}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => router.push('/mon-espace/avec-menu/factures')}
                            className="flex items-center gap-3 bg-white border border-[#B05F63] text-[#B05F63] px-6 py-4 rounded-xl shadow-sm hover:bg-[#FFF0F3] transition-all font-semibold"
                        >
                            <FileText className="w-5 h-5" />
                            Consulter mes factures
                        </button>

                        <button
                            onClick={() => router.push('/mon-espace/avec-menu/avis')}
                            className="flex items-center gap-3 bg-white border border-[#B05F63] text-[#B05F63] px-6 py-4 rounded-xl shadow-sm hover:bg-[#FFF0F3] transition-all font-semibold"
                        >
                            <Star className="w-5 h-5" />
                            Laisser un avis
                        </button>
                    </div>
                </section>
            </div>
        </main>
    )
}