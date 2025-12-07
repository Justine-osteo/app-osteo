'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Download, Loader2, FileText } from 'lucide-react'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import MenuLateralClient from '@/components/ui/MenuLateralClient'

// Types de données mis à jour
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
    const [factures, setFactures] = useState<Facture[]>([])
    const [animaux, setAnimaux] = useState<AnimalResume[]>([])
    const [loading, setLoading] = useState(true)
    // État pour gérer le chargement d'un téléchargement spécifique
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

    return (
        <div className="flex flex-col md:flex-row max-w-7xl mx-auto p-6 gap-6">
            <MenuLateralClient animaux={animaux} />
            <main className="flex-1">
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
    )
}