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
                color: '#6E4B42',
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
    // Nouvel état pour gérer l'ouverture/fermeture de la pop-up mobile
    const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false)
    const router = useRouter()

    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const initPage = async () => {
            try {
                const lottiePromise = fetch('/lottie/chien-chargement.json')
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null);

                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (userError || !user) {
                    router.push('/connexion')
                    return
                }
                setUser(user)

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

    // Contenu du profil (factorisé pour être utilisé dans la sidebar et la modale)
    const ProfileContent = () => (
        <>
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#B05F63] mb-3 shadow-sm border-2 border-white">
                    <UserIcon className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-charm mb-1 font-bold text-[#6E4B42]">Mes informations</h2>
                {client?.nom && (
                    <p className="font-semibold text-lg text-[#6E4B42]">{client.nom}</p>
                )}
            </div>

            {client ? (
                <div className="text-sm space-y-3 bg-white/50 p-4 rounded-xl backdrop-blur-sm text-[#6E4B42]">
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

            <div className="pt-4 space-y-3">
                <button
                    onClick={() => router.push('/mon-espace/modifier')}
                    className="w-full bg-white text-[#B05F63] hover:bg-[#B05F63] hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm border border-[#F3D8DD]"
                >
                    <Edit3 className="w-4 h-4" /> Modifier mes infos
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full bg-[#E5E7EB] hover:bg-[#6E4B42] hover:text-white text-gray-600 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
            </div>
        </>
    )

    return (
        <main className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto p-6 bg-[#FFF5F7] min-h-screen relative">

            {/* --- SIDEBAR DESKTOP (Cachée sur mobile) --- */}
            <aside className="hidden md:block w-1/4 bg-[#FBEAEC] rounded-2xl p-6 shadow-md h-fit border-2 border-[#F3D8DD]">
                <ProfileContent />
            </aside>

            {/* --- MODALE MOBILE (Visible seulement si isMobileProfileOpen est true) --- */}
            {isMobileProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm md:hidden">
                    <div className="bg-[#FBEAEC] w-full max-w-sm rounded-2xl p-6 relative shadow-xl border-2 border-[#F3D8DD] animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsMobileProfileOpen(false)}
                            className="absolute top-4 right-4 text-[#6E4B42] hover:bg-white/50 p-1 rounded-full transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <ProfileContent />
                    </div>
                </div>
            )}

            {/* --- CONTENU PRINCIPAL --- */}
            <div className="flex-1">
                {/* Header avec bouton profil mobile */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-[#F3D8DD] mb-8 flex justify-between items-start gap-4">
                    <div>
                        <div className="text-[#B05F63] mb-2">
                            <TitrePrincipal>
                                {prenom ? `Bonjour ${prenom} !` : 'Bienvenue dans votre espace'}
                            </TitrePrincipal>
                        </div>
                        <p className="text-[#6E4B42] opacity-80 mt-2">
                            Heureux de vous retrouver. Voici l'aperçu de vos compagnons.
                        </p>
                    </div>

                    {/* Bouton Profil Mobile (Visible seulement sur mobile) */}
                    <button
                        onClick={() => setIsMobileProfileOpen(true)}
                        className="md:hidden flex flex-col items-center justify-center bg-[#FBEAEC] border-2 border-[#F3D8DD] text-[#B05F63] p-2 rounded-xl shadow-sm active:scale-95 transition"
                    >
                        <UserIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold mt-1">Profil</span>
                    </button>
                </div>

                <section className="mt-6">
                    <div className="mb-4 pl-1 flex items-center gap-2 text-[#6E4B42]">
                        <span className="w-2 h-6 bg-[#B05F63] rounded-full"></span>
                        <SousTitre>Mes animaux</SousTitre>
                    </div>

                    {animaux.length === 0 && (
                        <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-[#F3D8DD] text-center">
                            <p className="text-[#6E4B42] text-lg mb-2">Aucun animal enregistré.</p>
                            <p className="text-sm text-[#B05F63]">Ils apparaîtront ici après votre première consultation.</p>
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
                                className="bg-[#FBEAEC] border-2 border-[#F3D8DD] shadow-sm hover:shadow-md hover:border-[#B05F63] transition-all"
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-12">
                    <div className="mb-4 pl-1 flex items-center gap-2 text-[#6E4B42]">
                        <span className="w-2 h-6 bg-[#B05F63] rounded-full"></span>
                        <SousTitre>Autres actions</SousTitre>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => router.push('/mon-espace/avec-menu/factures')}
                            className="flex items-center gap-3 bg-white border-2 border-[#F3D8DD] text-[#6E4B42] px-6 py-4 rounded-xl shadow-sm hover:bg-[#FFF0F3] hover:border-[#B05F63] hover:text-[#B05F63] transition-all font-semibold"
                        >
                            <div className="bg-[#FFF0F3] p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-[#B05F63]" />
                            </div>
                            Consulter mes factures
                        </button>

                        <button
                            onClick={() => router.push('/mon-espace/avec-menu/avis')}
                            className="flex items-center gap-3 bg-white border-2 border-[#F3D8DD] text-[#6E4B42] px-6 py-4 rounded-xl shadow-sm hover:bg-[#FFF0F3] hover:border-[#B05F63] hover:text-[#B05F63] transition-all font-semibold"
                        >
                            <div className="bg-[#FFF0F3] p-2 rounded-lg">
                                <Star className="w-5 h-5 text-[#B05F63]" />
                            </div>
                            Laisser un avis
                        </button>
                    </div>
                </section>
            </div>
        </main>
    )
}