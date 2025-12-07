'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Lottie from 'lottie-react'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import SousTitre from '@/components/ui/SousTitre'
import CarteItem from '@/components/CarteItem'
import type { User } from '@supabase/supabase-js'
// AJOUTS POUR LE TYPAGE
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// --- Interfaces pour typer vos données ---
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

// --- Composant pour l'écran de chargement ---
function EcranDeChargement({ animationData }: { animationData: any }) {
    return (
        <main
            style={{
                height: '100vh',
                backgroundColor: '#f3d8dd',
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
            <p style={{ fontWeight: '600' }}>Chargement de l'espace personnel...</p>
        </main>
    )
}

// --- Page principale de l'espace client ---
export default function EspaceClientPage() {
    const [user, setUser] = useState<User | null>(null)
    const [animaux, setAnimaux] = useState<Animal[]>([])
    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)
    const [animationData, setAnimationData] = useState<any>(null)
    const router = useRouter()

    // CORRECTION : On force le typage du client ici
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    // Effet pour charger l'animation Lottie
    useEffect(() => {
        fetch('/lottie/chien-chargement.json')
            .then((res) => res.json())
            .then(setAnimationData)
            .catch(() => console.error("Erreur chargement Lottie"))
    }, [])

    // Effet pour charger toutes les données de la page
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                console.error('Utilisateur non connecté ou erreur', userError)
                router.push('/connexion')
                return
            }
            setUser(user)

            // Utilisation de supabaseTyped
            const { data: clientData, error: clientError } = await supabaseTyped
                .from('clients')
                .select('id, nom, adresse, telephone, email')
                .eq('auth_id', user.id)
                .single()

            if (clientError || !clientData) {
                console.error('Client introuvable', clientError)
                setLoading(false)
                return
            }
            // On s'assure que le type correspond
            setClient(clientData as Client)

            // Utilisation de supabaseTyped
            const { data: animauxData, error: animauxError } = await supabaseTyped
                .from('animaux')
                .select('id, nom, photo_url')
                .eq('client_id', clientData.id)

            if (animauxError) {
                console.error('Erreur fetch animaux', animauxError)
            } else if (animauxData) {
                setAnimaux(animauxData)
            }

            setLoading(false)
        }

        fetchData()
    }, [router, supabaseTyped])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/connexion')
    }

    if (loading || !animationData) {
        return <EcranDeChargement animationData={animationData} />
    }

    return (
        <main className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto p-6">
            {/* Colonne latérale */}
            <aside className="w-full md:w-1/4 bg-[#F3D8DD] text-[#6E4B42] rounded-lg p-4 space-y-4 shadow-md h-fit">
                <h2 className="text-xl font-charm mb-2">Mes informations</h2>
                {client ? (
                    <div className="text-sm space-y-1">
                        <p className="font-semibold">{client.nom}</p>
                        <p>{client.adresse}</p>
                        <p>Tél. : {client.telephone}</p>
                        <p>Email : {client.email}</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">Informations client non trouvées.</p>
                )}

                <button
                    onClick={() => router.push('/mon-espace/modifier')}
                    className="mt-4 w-full bg-[#B05F63] hover:bg-[#6E4B42] text-white text-sm font-semibold py-2 px-4 rounded"
                >
                    Modifier
                </button>

                <hr className="border-t border-[#d3b8bc] my-4" />

                <button
                    onClick={handleLogout}
                    className="w-full bg-stone-500 hover:bg-stone-600 text-white text-sm font-semibold py-2 px-4 rounded"
                >
                    Se déconnecter
                </button>
            </aside>

            {/* Contenu principal */}
            <div className="flex-1">
                <TitrePrincipal>Bienvenue dans l'espace personnel</TitrePrincipal>

                <section className="mt-6">
                    <SousTitre>Mes animaux</SousTitre>
                    {animaux.length === 0 && <p>Aucun animal enregistré.</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {animaux.map((animal) => (
                            <CarteItem
                                key={animal.id}
                                titre={animal.nom}
                                imageUrl={animal.photo_url}
                                fallback="Pas de photo"
                                boutonTexte="Voir le dossier"
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}`)}
                                className="h-[280px]"
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-12">
                    <SousTitre>Autres actions</SousTitre>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <CarteItem
                            titre="Mes factures"
                            imageUrl="/images/factures.jpg"
                            fallback="📄"
                            boutonTexte="Voir"
                            onClick={() => router.push('/mon-espace/avec-menu/factures')}
                            className="h-[280px]"
                        />
                        <CarteItem
                            titre="Laisser un avis"
                            imageUrl="https://images.unsplash.com/photo-1586486855510-020181a33dc1?q=80&w=2070&auto=format&fit=crop"
                            fallback="⭐"
                            boutonTexte="Donner"
                            onClick={() => router.push('/mon-espace/avec-menu/avis')}
                            className="h-[280px]"
                        />
                    </div>
                </section>
            </div>
        </main>
    )
}