'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import Link from 'next/link'
import SousTitre from '@/components/ui/SousTitre'
import { AnimalSchema, AnimalResumeArraySchema, type Animal } from '@/zod/animal'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { Menu, X, ArrowLeft } from 'lucide-react'

interface AnimalResume {
    id: string
    nom: string
}

// Adaptation pour Next.js 15 (params est une Promise)
export default function AnimalClient({ params }: { params: Promise<{ id: string }> }) {
    const [id, setId] = useState<string | null>(null)

    // Récupération de l'ID compatible Next.js 15
    useEffect(() => {
        if (params instanceof Promise) {
            params.then(p => setId(p.id))
        } else {
            setId((params as any).id)
        }
    }, [params])

    const router = useRouter()
    const [animal, setAnimal] = useState<Animal | null>(null)
    const [autresAnimaux, setAutresAnimaux] = useState<AnimalResume[]>([])
    const [loading, setLoading] = useState(true)
    const [modifEnAttente, setModifEnAttente] = useState(false)

    // État pour le menu mobile (Pop-up)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        if (!id) return

        async function fetchAnimal() {
            setLoading(true)

            // On force le type string pour id
            const safeId = id as string

            const { data: currentAnimal, error } = await supabase
                .from('animaux')
                .select('*')
                .eq('id', safeId)
                .single()

            if (error || !currentAnimal) {
                console.error('Erreur chargement animal:', error)
                setAnimal(null)
                setLoading(false)
                return
            }

            const parsedAnimal = AnimalSchema.safeParse(currentAnimal)
            if (!parsedAnimal.success) {
                console.error('Erreur validation Zod animal:', parsedAnimal.error.format())
                setAnimal(null)
                setLoading(false)
                return
            }

            setAnimal(parsedAnimal.data)

            const { data: autres, error: errorAutres } = await supabase
                .from('animaux')
                .select('id, nom')
                .eq('client_id', parsedAnimal.data.client_id)
                .neq('id', parsedAnimal.data.id)

            if (errorAutres || !autres) {
                setAutresAnimaux([])
            } else {
                const parsedAutres = AnimalResumeArraySchema.safeParse(autres)
                if (parsedAutres.success) {
                    setAutresAnimaux(parsedAutres.data)
                }
            }

            const { data: modifData } = await supabase
                .from('modifications_animaux')
                .select('id')
                .eq('animal_id', safeId)
                .eq('statut', 'en_attente')
                .maybeSingle()

            setModifEnAttente(!!modifData)
            setLoading(false)
        }

        fetchAnimal()
    }, [id])

    if (loading) return <EcranDeChargement texte="Chargement du dossier..." />

    if (!animal) return (
        <div className="min-h-screen bg-[#FFF0F3] flex flex-col items-center justify-center p-6 text-[#6E4B42]">
            <p className="text-xl font-charm mb-4">Dossier introuvable</p>
            <button
                onClick={() => router.push('/mon-espace')}
                className="bg-[#B05F63] text-white px-4 py-2 rounded-lg hover:bg-[#8E3E42] transition"
            >
                Retour à l'accueil
            </button>
        </div>
    )

    // Contenu du menu (factorisé pour desktop et mobile)
    const MenuContent = () => (
        <>
            <button
                onClick={() => router.push('/mon-espace')}
                className="text-sm text-[#6E4B42] underline hover:text-[#B05F63] font-semibold flex items-center mb-4"
            >
                ← Retour à l'espace
            </button>
            <h2 className="text-xl font-charm mt-2 text-[#6E4B42]">Mes animaux</h2>
            <ul className="space-y-2 text-[#6E4B42]">
                <li className="font-bold border-l-4 border-[#B05F63] pl-2">{animal.nom}</li>
                {autresAnimaux.map((a) => (
                    <li key={a.id}>
                        <Link
                            href={`/mon-espace/avec-menu/animal/${a.id}`}
                            className="hover:underline block pl-3"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {a.nom}
                        </Link>
                    </li>
                ))}
            </ul>
            <hr className="my-4 border-[#dcb0b6]" />
            <ul className="space-y-2 text-[#6E4B42]">
                <li>
                    <Link href="/mon-espace/avec-menu/factures" className="block hover:underline font-charm">
                        Mes factures
                    </Link>
                </li>
                <li>
                    <Link href="/mon-espace/avec-menu/avis" className="block hover:underline font-charm">
                        Laisser un avis
                    </Link>
                </li>
            </ul>
        </>
    )

    return (
        // Fond principal harmonisé (#FFF0F3)
        <div className="min-h-screen bg-[#FFF0F3] p-6">

            {/* --- Navigation Mobile (Bouton Menu) --- */}
            <div className="md:hidden flex justify-between items-center mb-6">
                <button
                    onClick={() => router.push('/mon-espace')}
                    className="flex items-center text-[#6E4B42] font-semibold bg-white px-3 py-2 rounded-lg border border-[#F3D8DD] shadow-sm hover:bg-[#FBEAEC] transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </button>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex items-center gap-2 bg-[#F3D8DD] text-[#6E4B42] px-4 py-2 rounded-lg border border-[#dcb0b6] font-medium shadow-sm active:scale-95 transition"
                >
                    <Menu className="w-5 h-5" /> Menu Dossiers
                </button>
            </div>

            <div className="flex max-w-7xl mx-auto gap-6 relative">

                {/* --- Menu Latéral Desktop (Caché sur mobile) --- */}
                <aside className="hidden md:block w-1/4 bg-[#F3D8DD] text-[#6E4B42] rounded-lg p-4 space-y-4 shadow-md h-fit">
                    <MenuContent />
                </aside>

                {/* --- Menu Pop-up Mobile --- */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
                        <div className="bg-[#F3D8DD] w-full max-w-sm rounded-lg p-6 relative shadow-xl border-2 border-white animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-3 right-3 text-[#6E4B42] hover:bg-white/50 p-2 rounded-full transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <MenuContent />
                        </div>
                    </div>
                )}

                {/* --- Contenu Principal --- */}
                <main className="flex-1 space-y-8">
                    <TitrePrincipal>{animal.nom}</TitrePrincipal>

                    {modifEnAttente && (
                        <div className="bg-yellow-200 text-yellow-900 border border-yellow-600 rounded-md p-4 mb-4 font-semibold shadow-md max-w-2xl mx-auto text-center">
                            Modifications en attente de validation
                        </div>
                    )}

                    <section className="bg-[#B05F63] text-white rounded-lg p-6 shadow-md flex flex-col sm:flex-row gap-6 items-center">
                        {animal.photo_url ? (
                            <img
                                src={animal.photo_url}
                                alt={`Photo de ${animal.nom}`}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                {animal.nom.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="space-y-1 text-center sm:text-left">
                            <p><span className="font-semibold">Date de naissance :</span> {animal.date_naissance ? new Date(animal.date_naissance).toLocaleDateString() : 'Non renseignée'}</p>
                            <p><span className="font-semibold">Race :</span> {animal.race ?? 'Non renseigné'}</p>
                            <p><span className="font-semibold">Sexe :</span> {animal.sexe ?? 'Non renseigné'}</p>
                            <p><span className="font-semibold">Stérilisé :</span> {animal.sterilise ? 'Oui' : 'Non'}</p>
                            <p><span className="font-semibold">Activité :</span> {animal.activite ?? 'Non renseigné'}</p>
                            <p><span className="font-semibold">Poids :</span> {animal.poids !== null && animal.poids !== undefined ? animal.poids.toFixed(1) + ' kg' : 'Non renseigné'}</p>
                        </div>
                    </section>

                    <section className="bg-[#FDF1F3] rounded-lg p-6 shadow border border-pink-100 space-y-4">
                        <SousTitre>Ses antécédents médicaux</SousTitre>
                        <p className="italic text-gray-700">{animal.antecedents ?? 'Aucun renseignement disponible.'}</p>
                    </section>

                    <section className="bg-[#FDF1F3] rounded-lg p-6 shadow border border-pink-100 space-y-4">
                        <SousTitre>Ses comptes rendus</SousTitre>
                        <div className="flex gap-4 flex-wrap">
                            <button
                                className="bg-[#6E4B42] font-charm text-white font-semibold rounded-md px-6 py-3 hover:bg-[#5a3f33] transition shadow-sm"
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/osteopathie`)}
                            >
                                Ostéopathie
                            </button>
                            <button
                                className="bg-[#6E4B42] text-white font-semibold rounded-md px-6 py-3 hover:bg-[#5a3f33] transition shadow-sm"
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/nutrition`)}
                            >
                                Nutrition
                            </button>
                        </div>
                    </section>

                    <section className="flex flex-wrap gap-4 pt-4">
                        <button
                            className="bg-white text-[#6E4B42] border border-[#B05F63] font-semibold rounded-md px-6 py-2 hover:bg-[#B05F63] hover:text-white transition shadow-sm"
                            onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/modifier`)}
                        >
                            Modifier la fiche
                        </button>
                    </section>
                </main>
            </div>
        </div>
    )
}