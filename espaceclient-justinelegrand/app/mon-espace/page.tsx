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
import { MapPin, Phone, Mail, LogOut, Edit3, FileText, Star, User as UserIcon, X } from 'lucide-react'

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
                backgroundColor: '#FFF0F3',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                color: '#6E4B42', // Brun chaud
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
    const [loading, setLoading] = useState(true)
    const [animationData, setAnimationData] = useState<any>(null)

    // État pour gérer la visibilité de la pop-up profil sur mobile
    const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false)

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

    const prenom = client?.nom ? client.nom.split(' ')[0] : '';

    // Contenu du profil factorisé (pour éviter de dupliquer le code entre sidebar et pop-up)
    const ProfileContent = () => (
        <>
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#B05F63] mb-3 shadow-sm border-2 border-white">
                    <UserIcon className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-charm mb-2 text-[#6E4B42] font-bold">Mes informations</h2>
                {client?.nom && (
                    <p className="font-semibold text-lg text-[#6E4B42]">{client.nom}</p>
                )}
            </div>

            {client ? (
                <div className="text-sm space-y-3 text-[#6E4B42]">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#B05F63] mt-0.5 shrink-0" />
                        <p>{client.adresse || 'Adresse non renseignée'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-[#B05F63] shrink-0" />
                        <p>{client.telephone || 'Non renseigné'}</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-[#B05F63] mt-0.5 shrink-0" />
                        <p className="break-all">{client.email}</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic text-center">Profil incomplet.</p>
            )}

            <div className="pt-6 space-y-3">
                <button
                    onClick={() => router.push('/mon-espace/modifier')}
                    className="w-full flex items-center justify-center gap-2 border border-[#B05F63] text-[#B05F63] hover:bg-[#FFF0F3] font-semibold py-2.5 px-4 rounded-xl transition duration-200 text-sm bg-white"
                >
                    <Edit3 className="w-4 h-4" /> Modifier mes infos
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-[#E5E7EB] hover:bg-[#6E4B42] hover:text-white text-gray-600 font-semibold py-2.5 px-4 rounded-xl transition duration-200 text-sm"
                >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
            </div>
        </>
    )

    return (
        <main className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto p-6 bg-[#FFF0F3] min-h-screen relative">

            {/* --- SIDEBAR DESKTOP (Cachée sur mobile 'hidden md:block') --- */}
            <aside className="hidden md:block w-1/4 bg-[#FBEAEC] text-[#6E4B42] rounded-2xl p-6 space-y-4 shadow-md h-fit border-2 border-[#F3D8DD]">
                <ProfileContent />
            </aside>

            {/* --- POP-UP MOBILE (Affichée uniquement si isMobileProfileOpen est true) --- */}
            {isMobileProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
                    <div className="bg-[#FBEAEC] text-[#6E4B42] w-full max-w-sm rounded-2xl p-6 relative shadow-xl border-2 border-[#F3D8DD] animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsMobileProfileOpen(false)}
                            className="absolute top-4 right-4 text-[#6E4B42] hover:bg-white/50 p-2 rounded-full transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <ProfileContent />
                    </div>
                </div>
            )}

            {/* --- CONTENU PRINCIPAL --- */}
            <div className="flex-1">
                {/* Header avec Bouton Profil Mobile */}
                <div className="bg-[#FBEAEC] rounded-2xl p-8 shadow-sm border-2 border-[#F3D8DD] mb-8 flex justify-between items-start gap-4">
                    <div>
                        <div className="text-[#B05F63] mb-2">
                            <TitrePrincipal>
                                {prenom ? `Bonjour ${prenom} !` : 'Bienvenue dans votre espace'}
                            </TitrePrincipal>
                        </div>
                        <p className="text-[#6E4B42] opacity-80 mt-2">
                            Retrouvez ici le suivi complet de vos animaux, vos factures et vos prochains rendez-vous.
                        </p>
                    </div>

                    {/* Bouton pour ouvrir la pop-up (Visible seulement sur mobile 'md:hidden') */}
                    <button
                        onClick={() => setIsMobileProfileOpen(true)}
                        className="md:hidden flex flex-col items-center justify-center bg-white border-2 border-[#F3D8DD] text-[#B05F63] p-2.5 rounded-xl shadow-sm active:scale-95 transition"
                    >
                        <UserIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold mt-1">Profil</span>
                    </button>
                </div>

                <section className="mt-6">
                    <div className="mb-4 pl-1 text-[#6E4B42]">
                        <SousTitre>Mes animaux</SousTitre>
                    </div>
                    {animaux.length === 0 && (
                        <div className="bg-white p-8 rounded-xl border-2 border-dashed border-[#F3D8DD] text-center">
                            <p className="text-[#6E4B42]">Aucun animal enregistré pour le moment.</p>
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
                                className="h-[280px] bg-[#FBEAEC] border-2 border-[#F3D8DD] shadow-sm hover:shadow-md hover:border-[#B05F63] transition-all"
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-12">
                    <div className="mb-4 pl-1 text-[#6E4B42]">
                        <SousTitre>Autres actions</SousTitre>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CarteItem
                            titre="Mes factures"
                            imageUrl="/images/factures.jpg"
                            fallback="📄"
                            boutonTexte="Voir"
                            onClick={() => router.push('/mon-espace/avec-menu/factures')}
                            className="h-[280px] bg-[#FBEAEC] border-2 border-[#F3D8DD] shadow-sm hover:shadow-md hover:border-[#B05F63] transition-all"
                        />
                        <CarteItem
                            titre="Laisser un avis"
                            imageUrl="https://images.unsplash.com/photo-1586486855510-020181a33dc1?q=80&w=2070&auto=format&fit=crop"
                            fallback="⭐"
                            boutonTexte="Donner"
                            onClick={() => router.push('/mon-espace/avec-menu/avis')}
                            className="h-[280px] bg-[#FBEAEC] border-2 border-[#F3D8DD] shadow-sm hover:shadow-md hover:border-[#B05F63] transition-all"
                        />
                    </div>
                </section>
            </div>
        </main>
    )
}