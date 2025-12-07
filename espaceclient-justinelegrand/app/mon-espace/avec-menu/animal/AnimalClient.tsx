'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import Link from 'next/link'
import SousTitre from '@/components/ui/SousTitre'
import { AnimalSchema, AnimalResumeArraySchema, type Animal } from '@/zod/animal'
import EcranDeChargement from '@/components/ui/EcranDeChargement' // ✨ On importe le composant

interface AnimalResume {
    id: string
    nom: string
}

export default function AnimalClient({ id }: { id: string }) {
    const router = useRouter()
    const [animal, setAnimal] = useState<Animal | null>(null)
    const [autresAnimaux, setAutresAnimaux] = useState<AnimalResume[]>([])
    const [loading, setLoading] = useState(true)
    const [showTooltip, setShowTooltip] = useState(false)
    const [modifEnAttente, setModifEnAttente] = useState(false)

    useEffect(() => {
        async function fetchAnimal() {
            setLoading(true)

            const { data: currentAnimal, error } = await supabase
                .from('animaux')
                .select('*')
                .eq('id', id)
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

            // Le reste de votre logique de fetch (inchangée)...
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
                .eq('animal_id', id)
                .eq('statut', 'en_attente')
                .maybeSingle()

            setModifEnAttente(!!modifData)

            setLoading(false)
        }

        fetchAnimal()
    }, [id])

    // ✨ On utilise notre nouveau composant de chargement ici
    if (loading) return <EcranDeChargement texte="Chargement du dossier..." />

    if (!animal) return <p className="text-center mt-20">Animal introuvable.</p>

    // --- LE RESTE DE VOTRE JSX EST IDENTIQUE ---
    return (
        <div className="flex max-w-7xl mx-auto p-6 gap-6">
            {/* Menu latéral gauche */}
            <aside className="w-1/4 bg-[#F3D8DD] text-[#6E4B42] rounded-lg p-4 space-y-4 shadow-md h-fit">
                <button
                    onClick={() => router.push('/mon-espace')}
                    className="text-sm text-[#6E4B42] underline hover:text-[#B05F63] font-semibold"
                >
                    ← Retour
                </button>
                <h2 className="text-xl font-charm mt-2">Mes animaux</h2>
                <ul className="space-y-2">
                    <li className="font-bold">{animal.nom}</li>
                    {autresAnimaux.map((a) => (
                        <li key={a.id}>
                            <Link
                                href={`/mon-espace/avec-menu/animal/${a.id}`}
                                className="hover:underline block"
                            >
                                {a.nom}
                            </Link>
                        </li>
                    ))}
                </ul>
                <hr className="my-4" />
                <ul className="space-y-2">
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
            </aside>

            {/* Contenu principal */}
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
                            ?
                        </div>
                    )}
                    <div>
                        <p>Date de naissance : {animal.date_naissance ? new Date(animal.date_naissance).toLocaleDateString() : 'Non renseignée'}</p>
                        <p>Race : {animal.race ?? 'Non renseigné'}</p>
                        <p>Sexe : {animal.sexe ?? 'Non renseigné'}</p>
                        <p>Stérilisé : {animal.sterilise ? 'Oui' : 'Non'}</p>
                        <p>Activité : {animal.activite ?? 'Non renseigné'}</p>
                        <p>Poids : {animal.poids !== null && animal.poids !== undefined ? animal.poids.toFixed(1) + ' kg' : 'Non renseigné'}</p>
                    </div>
                </section>

                <section className="bg-[#FDF1F3] rounded-lg p-6 shadow border space-y-4">
                    <SousTitre>Ses antécédents médicaux</SousTitre>
                    <p>{animal.antecedents ?? 'Aucun renseignement disponible.'}</p>
                </section>

                <section className="bg-[#FDF1F3] rounded-lg p-6 shadow border space-y-4">
                    <SousTitre>Ses comptes rendus</SousTitre>
                    <div className="flex gap-4 flex-wrap">
                        <button
                            className="bg-[#6E4B42] font-charm text-white font-semibold rounded-md px-6 py-3 hover:bg-[#5a3f33] transition"
                            onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/osteopathie`)}
                        >
                            Ostéopathie
                        </button>
                        <button
                            className="bg-[#6E4B42] text-white font-semibold rounded-md px-6 py-3 hover:bg-[#5a3f33] transition"
                            onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/nutrition`)}
                        >
                            Nutrition
                        </button>
                    </div>
                </section>

                <section className="flex flex-wrap gap-4">
                    <button
                        className="bg-[#F3D8DD] text-[#6E4B42] border border-[#B05F63] font-semibold rounded-md px-6 py-2 hover:bg-[#B05F63] hover:text-white transition"
                        onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/modifier`)}
                    >
                        Modifier la fiche
                    </button>
                    {/* Le reste de votre JSX est identique */}
                </section>
            </main>
        </div>
    )
}