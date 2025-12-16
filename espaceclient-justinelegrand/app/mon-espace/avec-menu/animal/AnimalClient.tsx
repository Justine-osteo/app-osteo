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

            // Validation Zod souple (on log l'erreur mais on ne bloque pas forcément tout si les données sont partielles)
            const parsedAnimal = AnimalSchema.safeParse(currentAnimal)
            if (!parsedAnimal.success) {
                console.warn('Validation Zod (Animal) :', parsedAnimal.error.format())
                // On utilise quand même les données brutes si le parsing échoue partiellement pour ne pas bloquer l'UI
                setAnimal(currentAnimal as Animal)
            } else {
                setAnimal(parsedAnimal.data)
            }

            // 2. Récupérer les autres animaux
            // On utilise currentAnimal.client_id directement
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

    // CORRECTION ICI : Utilisation de la prop 'texte' au lieu de 'animationData'
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
            <div className="md:hidden flex justify-between items-center mb-6">
                <button
                    onClick={() => router.push('/mon-espace')}
                    className="flex items-center text-[#6E4B42] font-semibold bg-white px-4 py-2.5 rounded-xl border border-[#F3D8DD] shadow-sm hover:bg-[#FBEAEC] transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </button>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex items-center gap-2 bg-[#FBEAEC] text-[#B05F63] px-4 py-2.5 rounded-xl border border-[#F3D8DD] font-bold shadow-sm active:scale-95 transition"
                >
                    <Menu className="w-5 h-5" /> Dossiers
                </button>
            </div>

            <div className="flex max-w-7xl mx-auto gap-8">

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
                <main className="flex-1 space-y-8">

                    {/* Header Nom avec Fond Blanc */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-[#F3D8DD] flex items-center justify-between">
                        <div className="text-[#B05F63] mb-0">
                            <TitrePrincipal><center>{animal.nom}</center></TitrePrincipal>
                        </div>
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

                    {/* Carte Identité */}
                    <section className="bg-white rounded-2xl p-8 shadow-sm border-2 border-[#F3D8DD] flex flex-col md:flex-row gap-10 items-start">
                        {/* Photo */}
                        <div className="shrink-0 mx-auto md:mx-0 relative group">
                            {animal.photo_url ? (
                                <div className="w-40 h-40 rounded-full p-1.5 border-4 border-[#FBEAEC] shadow-md bg-white transition-transform group-hover:scale-105">
                                    <img
                                        src={animal.photo_url}
                                        alt={`Photo de ${animal.nom}`}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-40 h-40 rounded-full bg-[#FBEAEC] border-4 border-white shadow-md flex items-center justify-center text-5xl font-bold text-[#B05F63] transition-transform group-hover:scale-105">
                                    {animal.nom.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {/* Pastille Sexe */}
                            <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md border border-[#F3D8DD] text-[#B05F63] font-bold text-sm uppercase">
                                {animal.sexe === 'mâle' ? '♂' : animal.sexe === 'femelle' ? '♀' : '?'}
                            </div>
                        </div>

                        {/* Infos Détails */}
                        <div className="flex-1 w-full space-y-4 text-sm text-gray-600">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#FFF5F7] p-4 rounded-xl border border-[#F3D8DD]">
                                    <p className="text-xs text-[#B05F63] uppercase tracking-wide font-bold mb-1 flex items-center gap-1"><PawPrint className="w-3 h-3" /> Race</p>
                                    <p className="font-bold text-[#6E4B42] text-lg">{animal.race ?? 'Non renseignée'}</p>
                                </div>
                                <div className="bg-[#FFF5F7] p-4 rounded-xl border border-[#F3D8DD]">
                                    <p className="text-xs text-[#B05F63] uppercase tracking-wide font-bold mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Naissance</p>
                                    <p className="font-bold text-[#6E4B42] text-lg">
                                        {animal.date_naissance ? new Date(animal.date_naissance).toLocaleDateString() : 'Inconnue'}
                                    </p>
                                </div>
                                <div className="bg-[#FFF5F7] p-4 rounded-xl border border-[#F3D8DD]">
                                    <p className="text-xs text-[#B05F63] uppercase tracking-wide font-bold mb-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Stérilisé</p>
                                    <p className="font-bold text-[#6E4B42] text-lg">{animal.sterilise ? 'Oui' : 'Non'}</p>
                                </div>
                            </div>

                            <div className="bg-[#FFF5F7] p-4 rounded-xl border border-[#F3D8DD]">
                                <p className="text-xs text-[#B05F63] uppercase tracking-wide font-bold mb-1">Activité</p>
                                <p className="text-[#6E4B42] font-medium leading-relaxed">{animal.activite ?? 'Non renseignée'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Antécédents */}
                    <section className="bg-white rounded-2xl p-8 shadow-sm border-2 border-[#F3D8DD] space-y-4">
                        <div className="text-[#6E4B42] flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#B05F63]" />
                            <SousTitre>Antécédents médicaux</SousTitre>
                        </div>
                        <div className="bg-[#FFF5F7] p-6 rounded-xl border border-[#F3D8DD] text-[#6E4B42] italic leading-relaxed">
                            {animal.antecedents ? animal.antecedents : 'Aucun antécédent particulier signalé.'}
                        </div>
                    </section>

                    {/* Actions / Comptes rendus */}
                    <section className="space-y-6">
                        <div className="text-[#6E4B42] px-1 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#B05F63]" />
                            <SousTitre>Comptes rendus & Actions</SousTitre>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <button
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/osteopathie`)}
                                className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-[#F3D8DD] text-[#6E4B42] p-6 rounded-2xl shadow-sm hover:bg-[#FFF0F3] hover:border-[#B05F63] hover:text-[#B05F63] transition-all group"
                            >
                                <div className="bg-[#FFF0F3] p-3 rounded-full group-hover:bg-white transition-colors">
                                    <Activity className="w-6 h-6 text-[#B05F63]" />
                                </div>
                                <span className="font-bold">Ostéopathie</span>
                            </button>

                            <button
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/nutrition`)}
                                className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-[#F3D8DD] text-[#6E4B42] p-6 rounded-2xl shadow-sm hover:bg-[#FFF0F3] hover:border-[#B05F63] hover:text-[#B05F63] transition-all group"
                            >
                                <div className="bg-[#FFF0F3] p-3 rounded-full group-hover:bg-white transition-colors">
                                    <Utensils className="w-6 h-6 text-[#B05F63]" />
                                </div>
                                <span className="font-bold">Nutrition</span>
                            </button>

                            <button
                                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animal.id}/modifier`)}
                                className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-[#F3D8DD] text-[#6E4B42] p-6 rounded-2xl shadow-sm hover:bg-[#FFF0F3] hover:border-[#B05F63] hover:text-[#B05F63] transition-all group"
                            >
                                <div className="bg-[#FFF0F3] p-3 rounded-full group-hover:bg-white transition-colors">
                                    <Edit3 className="w-6 h-6 text-[#B05F63]" />
                                </div>
                                <span className="font-bold">Modifier la fiche</span>
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}