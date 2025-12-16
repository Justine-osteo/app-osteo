'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import SousTitre from '@/components/ui/SousTitre'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { AnimalSchema, AnimalResumeArraySchema, type Animal } from '@/zod/animal'
import { Menu, X, PawPrint, FileText, Star, ArrowLeft, Edit3, Activity, Utensils, Calendar, Ruler, Weight } from 'lucide-react'

interface AnimalResume {
    id: string
    nom: string
}

export default function AnimalClient({ id }: { id: string }) {
    const router = useRouter()
    const [animal, setAnimal] = useState<Animal | null>(null)
    const [autresAnimaux, setAutresAnimaux] = useState<AnimalResume[]>([])
    const [loading, setLoading] = useState(true)
    const [modifEnAttente, setModifEnAttente] = useState(false)

    // État pour le menu mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Initialisation du client Supabase
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function fetchAnimal() {
            setLoading(true)

            // 1. Récupérer l'animal courant
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

            // Validation Zod souple
            const parsedAnimal = AnimalSchema.safeParse(currentAnimal)
            if (!parsedAnimal.success) {
                console.warn('Validation Zod (Animal) :', parsedAnimal.error.format())
                setAnimal(currentAnimal as Animal)
            } else {
                setAnimal(parsedAnimal.data)
            }

            // 2. Récupérer les autres animaux
            const clientId = currentAnimal.client_id
            const { data: autres, error: errorAutres } = await supabase
                .from('animaux')
                .select('id, nom')
                .eq('client_id', clientId)
                .neq('id', id)

            if (!errorAutres && autres) {
                setAutresAnimaux(autres as AnimalResume[])
            }

            // 3. Vérifier les modifications en attente
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
    }, [id, supabase])

    if (loading) return <EcranDeChargement texte="Chargement du dossier..." />

    if (!animal) return (
        <div className="min-h-screen bg-[#FFF0F3] flex flex-col items-center justify-center p-6 text-[#6E4B42]">
            <p className="text-xl font-charm mb-4">Dossier introuvable</p>
            <button
                onClick={() => router.push('/mon-espace')}
                className="bg-[#B05F63] text-white px-6 py-2 rounded-lg hover:bg-[#8E3E42] transition"
            >
                Retour à l'accueil
            </button>
        </div>
    )

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
                {/* Animal Actuel */}
                <li className="bg-white border-l-4 border-[#B05F63] p-3 rounded-r-lg shadow-sm">
                    <span className="font-bold text-[#6E4B42] flex items-center justify-between">
                        {animal.nom}
                        <span className="text-[10px] bg-[#FFF0F3] text-[#B05F63] px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Actif</span>
                    </span>
                </li>

                {/* Autres Animaux */}
                {autresAnimaux.map((a) => (
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
                <Link
                    href="/mon-espace/avec-menu/avis"
                    className="flex items-center gap-3 text-[#6E4B42] hover:text-[#B05F63] transition font-medium p-2 rounded-lg hover:bg-white/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <Star className="w-5 h-5" /> Laisser un avis
                </Link>
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
                    <Menu className="w-5 h-5" /> Dossiers
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
                <main className="flex-1 space-y-4 md:space-y-6">

                    {/* Header Nom Épuré (Sans fond blanc) */}
                    <div className="text-center mb-2">
                        <TitrePrincipal>{animal.nom}</TitrePrincipal>
                    </div>

                    {/* Alerte Modif */}
                    {modifEnAttente && (
                        <div className="bg-white border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                            <Activity className="w-5 h-5 text-amber-500 mt-0.5" />
                            <p className="text-sm text-gray-600">
                                <span className="font-bold text-gray-800">Modification en attente :</span> Votre demande est en cours d'examen par l'ostéopathe.
                            </p>
                        </div>
                    )}

                    {/* Carte Identité - Version Agrandie et Lisible */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border-2 border-[#F3D8DD] flex flex-col items-center">

                        {/* En-tête : Photo et Nom (centré) */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group mb-4">
                                {animal.photo_url ? (
                                    <div className="w-40 h-40 rounded-full p-1.5 border-4 border-[#B05F63] shadow-lg bg-white transition-transform group-hover:scale-105">
                                        <img
                                            src={animal.photo_url}
                                            alt={`Photo de ${animal.nom}`}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-40 h-40 rounded-full bg-[#FBEAEC] border-4 border-[#B05F63] shadow-lg flex items-center justify-center text-6xl font-bold text-[#B05F63] transition-transform group-hover:scale-105">
                                        {animal.nom.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {/* Pastille Sexe */}
                                <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md border border-[#F3D8DD] text-[#B05F63] font-bold text-lg uppercase w-10 h-10 flex items-center justify-center">
                                    {animal.sexe === 'mâle' ? '♂' : animal.sexe === 'femelle' ? '♀' : '?'}
                                </div>
                            </div>
                        </div>

                        {/* Grille d'Informations - Plus grosse et aérée */}
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                            {/* Bloc Race */}
                            <div className="bg-[#FFF5F7] p-5 rounded-2xl border border-[#F3D8DD] flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                <p className="text-[#B05F63] font-charm text-xl mb-1 flex items-center gap-2">
                                    <PawPrint className="w-5 h-5" /> Race
                                </p>
                                <p className="font-bold text-[#6E4B42] text-xl md:text-2xl">{animal.race ?? 'Non renseignée'}</p>
                            </div>

                            {/* Bloc Naissance */}
                            <div className="bg-[#FFF5F7] p-5 rounded-2xl border border-[#F3D8DD] flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                <p className="text-[#B05F63] font-charm text-xl mb-1 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" /> Naissance
                                </p>
                                <p className="font-bold text-[#6E4B42] text-xl md:text-2xl">
                                    {animal.date_naissance ? new Date(animal.date_naissance).toLocaleDateString() : 'Inconnue'}
                                </p>
                            </div>

                            {/* Bloc Stérilisé */}
                            <div className="bg-[#FFF5F7] p-5 rounded-2xl border border-[#F3D8DD] flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                <p className="text-[#B05F63] font-charm text-xl mb-1 flex items-center gap-2">
                                    <Ruler className="w-5 h-5" /> Stérilisé
                                </p>
                                <p className="font-bold text-[#6E4B42] text-xl md:text-2xl">{animal.sterilise ? 'Oui' : 'Non'}</p>
                            </div>

                            {/* Bloc Activité */}
                            <div className="bg-[#FFF5F7] p-5 rounded-2xl border border-[#F3D8DD] flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                <p className="text-[#B05F63] font-charm text-xl mb-1 flex items-center gap-2">
                                    <Activity className="w-5 h-5" /> Activité
                                </p>
                                <p className="font-bold text-[#6E4B42] text-xl md:text-2xl leading-tight">{animal.activite ?? 'Non renseignée'}</p>
                            </div>

                        </div>
                    </section>

                    {/* Antécédents - Style cohérent */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[#F3D8DD] space-y-3">
                        <div className="text-[#6E4B42] flex items-center gap-2 mb-2">
                            <div className="p-2 bg-[#FFF0F3] rounded-full">
                                <Activity className="w-6 h-6 text-[#B05F63]" />
                            </div>
                            <SousTitre>Antécédents médicaux</SousTitre>
                        </div>
                        <div className="bg-[#FFF5F7] p-6 rounded-2xl border border-[#F3D8DD] text-[#6E4B42] italic leading-relaxed text-lg text-center md:text-left">
                            {animal.antecedents ? animal.antecedents : 'Aucun antécédent particulier signalé.'}
                        </div>
                    </section>

                    {/* Actions / Comptes rendus - Boutons Rose Gold Plein */}
                    <section className="space-y-4 pt-4">
                        <div className="text-[#6E4B42] px-1 flex items-center gap-2 mb-2">
                            <div className="p-2 bg-[#FFF0F3] rounded-full">
                                <FileText className="w-6 h-6 text-[#B05F63]" />
                            </div>
                            <SousTitre>Comptes rendus & Actions</SousTitre>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <button
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/osteopathie`)}
                                className="flex flex-col items-center justify-center gap-3 bg-[#B05F63] text-white p-6 rounded-3xl shadow-lg hover:bg-[#9E4D52] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                    <Activity className="w-8 h-8 text-white" />
                                </div>
                                <span className="font-bold text-lg font-charm tracking-wide">Ostéopathie</span>
                            </button>

                            <button
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/nutrition`)}
                                className="flex flex-col items-center justify-center gap-3 bg-[#B05F63] text-white p-6 rounded-3xl shadow-lg hover:bg-[#9E4D52] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                    <Utensils className="w-8 h-8 text-white" />
                                </div>
                                <span className="font-bold text-lg font-charm tracking-wide">Nutrition</span>
                            </button>

                            <button
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/modifier`)}
                                className="flex flex-col items-center justify-center gap-3 bg-[#B05F63] text-white p-6 rounded-3xl shadow-lg hover:bg-[#9E4D52] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                    <Edit3 className="w-8 h-8 text-white" />
                                </div>
                                <span className="font-bold text-lg font-charm tracking-wide">Modifier la fiche</span>
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}