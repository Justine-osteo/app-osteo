'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Download, Loader2, FileText, Menu, X, PawPrint, Star, ArrowLeft } from 'lucide-react'
import EcranDeChargement from '@/components/ui/EcranDeChargement'

// Types de données
type SeanceInfo = {
    date: string
}

type Facture = {
    id: string
    nom_fichier: string
    url_fichier: string
    // On ajoute la relation avec la séance pour récupérer la vraie date
    seances: SeanceInfo | null
}

type AnimalResume = {
    id: string
    nom: string
}

export default function FacturesPage() {
    const router = useRouter()
    const [factures, setFactures] = useState<Facture[]>([])
    const [animaux, setAnimaux] = useState<AnimalResume[]>([])
    const [loading, setLoading] = useState(true)
    // État pour gérer le chargement d'un téléchargement spécifique
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    // État pour le menu mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // CORRECTION TS : On caste le résultat pour dire explicitement qu'on attend un objet avec un id
            const { data: clientData } = await supabase
                .from('clients')
                .select('id')
                .eq('auth_id', user.id)
                .single() as { data: { id: string } | null, error: any }

            if (!clientData) {
                setLoading(false)
                return
            }

            // On lance les deux requêtes en parallèle
            const [facturesResult, animauxResult] = await Promise.all([
                // MODIFICATION ICI : On joint la table 'seances' pour avoir la date
                // On utilise <any> pour éviter les erreurs de typage strict si les types ne sont pas générés
                supabase
                    .from('factures')
                    .select('*, seances(date)')
                    .eq('client_id', clientData.id)
                    // On trie par la date de la séance (via la relation), sinon par défaut création
                    .order('date_creation', { ascending: false }), // Note: le tri par relation est plus complexe, on trie par création par défaut ou on trie en JS après

                supabase.from('animaux').select('id, nom').eq('client_id', clientData.id)
            ])

            // Tri manuel par date de séance pour être sûr (du plus récent au plus ancien)
            if (facturesResult.data) {
                const sortedFactures = (facturesResult.data as any[]).sort((a, b) => {
                    const dateA = new Date(a.seances?.date || 0).getTime();
                    const dateB = new Date(b.seances?.date || 0).getTime();
                    return dateB - dateA;
                });
                setFactures(sortedFactures as Facture[])
            }

            if (animauxResult.data) setAnimaux(animauxResult.data)

            setLoading(false)
        }

        fetchData()
    }, [])

    // Fonction pour générer l'URL signée et télécharger
    const handleDownload = async (facture: Facture) => {
        try {
            setDownloadingId(facture.id)

            // 1. On doit extraire le chemin du fichier depuis l'URL publique stockée
            // L'URL ressemble à : .../factures/CLIENT_ID/UUID-nomfichier.pdf
            // On veut juste : CLIENT_ID/UUID-nomfichier.pdf
            const path = facture.url_fichier.split('/factures/')[1]

            if (!path) {
                alert("Erreur : Impossible de retrouver le fichier.")
                return
            }

            // 2. On demande une URL signée temporaire (valable 60 secondes)
            const { data, error } = await supabase.storage
                .from('factures')
                .createSignedUrl(path, 60, {
                    download: facture.nom_fichier // Force le téléchargement avec le bon nom
                })

            if (error) {
                console.error("Erreur download:", error)
                alert("Erreur lors du téléchargement.")
                return
            }

            // 3. On ouvre le lien dans un nouvel onglet (ce qui déclenche le download)
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank')
            }

        } catch (e) {
            console.error(e)
            alert("Une erreur est survenue.")
        } finally {
            setDownloadingId(null)
        }
    }

    if (loading) {
        return <EcranDeChargement texte="Chargement de vos factures..." />
    }

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
                {/* Lien Actif pour Factures */}
                <div className="bg-white border-l-4 border-[#B05F63] p-2 rounded-r-lg shadow-sm flex items-center gap-3 text-[#B05F63] font-bold">
                    <FileText className="w-5 h-5" /> Mes factures
                </div>
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
                    <TitrePrincipal>Mes factures</TitrePrincipal>

                    {factures.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-dashed border-gray-300 text-center mt-6">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-lg">Aucune facture disponible.</p>
                            <p className="text-sm text-gray-400">Les factures apparaîtront ici après vos consultations.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-6">
                            {factures.map((facture) => {
                                // On sécurise la date
                                const dateSeance = facture.seances?.date
                                    ? new Date(facture.seances.date)
                                    : null

                                return (
                                    <div key={facture.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-[#E5E7EB] hover:border-[#B05F63] transition-colors p-5 rounded-xl shadow-sm gap-4">
                                        <div>
                                            <h3 className="font-bold text-[#6E4B42] text-lg">
                                                {dateSeance
                                                    ? `Consultation du ${format(dateSeance, 'dd MMMM yyyy', { locale: fr })}`
                                                    : "Date inconnue"}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate max-w-[300px]" title={facture.nom_fichier}>
                                                Fichier : {facture.nom_fichier}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(facture)}
                                            disabled={downloadingId === facture.id}
                                            className="flex items-center justify-center gap-2 bg-[#FBEAEC] text-[#B05F63] hover:bg-[#B05F63] hover:text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 min-w-[140px]"
                                        >
                                            {downloadingId === facture.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Patientez...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" />
                                                    Télécharger
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}