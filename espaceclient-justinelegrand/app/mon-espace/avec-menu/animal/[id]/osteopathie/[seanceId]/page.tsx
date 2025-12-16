'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react'
import { AnimalSeanceParamsSchema } from '@/zod/params'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { pdf } from '@react-pdf/renderer'
import CompteRenduPDF, { SeanceTypePDF } from '@/components/CompteRenduPDF'

type SeanceFromDB = {
    id: string
    date: string
    motif?: string
    observations?: string
    observations_osteo?: string // Ajout du champ manquant
    recommandations?: string
    suivi?: string
    annotation_squelette_url?: string | null
    // Mesures
    mesure_ant_gauche_avant?: number
    mesure_ant_droite_avant?: number
    mesure_post_gauche_avant?: number
    mesure_post_droite_avant?: number
    mesure_ant_gauche_apres?: number
    mesure_ant_droite_apres?: number
    mesure_post_gauche_apres?: number
    mesure_post_droite_apres?: number
    animaux: {
        nom: string
        clients: {
            nom: string
        } | null
    } | null
}

export default function DetailSeanceOsteopathie() {
    const router = useRouter()
    const rawParams = useParams()

    const parsed = AnimalSeanceParamsSchema.safeParse(rawParams)
    if (!parsed.success) {
        return <p className="text-center mt-8 text-red-500">Paramètres de page invalides.</p>
    }

    const { id: animalId, seanceId } = parsed.data

    const [seance, setSeance] = useState<SeanceFromDB | null>(null)
    const [loading, setLoading] = useState(true)
    const [generatingPdf, setGeneratingPdf] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)

            // CORRECTION : Ajout de 'observations_osteo' dans la requête
            const { data, error } = await (supabase
                .from('seances') as any)
                .select(`
                    id, date, motif, observations, observations_osteo, recommandations, suivi, annotation_squelette_url,
                    mesure_ant_gauche_avant, mesure_ant_droite_avant, mesure_post_gauche_avant, mesure_post_droite_avant,
                    mesure_ant_gauche_apres, mesure_ant_droite_apres, mesure_post_gauche_apres, mesure_post_droite_apres,
                    animaux (
                        nom,
                        clients ( nom )
                    )
                `)
                .eq('id', seanceId)
                .single()

            if (error || !data) {
                console.error("Erreur chargement séance:", error)
                setSeance(null)
            } else {
                setSeance(data as SeanceFromDB)
            }

            setLoading(false)
        }

        fetchData()
    }, [seanceId])

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleDownloadPDF = async () => {
        if (!seance) return
        setGeneratingPdf(true)

        try {
            let finalImageAnnotation = null

            // 1. GESTION DE L'IMAGE (Squelette)
            if (seance.annotation_squelette_url) {
                let bucketName = '';
                let path = '';

                // Logique de détection du bucket
                if (seance.annotation_squelette_url.includes('/annotations/')) {
                    bucketName = 'annotations';
                    path = seance.annotation_squelette_url.split('/annotations/')[1];
                } else if (seance.annotation_squelette_url.includes('/schemas/')) {
                    bucketName = 'schemas';
                    path = seance.annotation_squelette_url.split('/schemas/')[1];
                } else {
                    // Fallback
                    const urlParts = seance.annotation_squelette_url.split('/public/');
                    if (urlParts.length > 1) {
                        const relativePath = urlParts[1];
                        const firstSlash = relativePath.indexOf('/');
                        bucketName = relativePath.substring(0, firstSlash);
                        path = relativePath.substring(firstSlash + 1);
                    }
                }

                // CORRECTION IMPORTANTE : decodeURIComponent
                // Si l'URL contient des espaces (%20) ou accents, le téléchargement échoue sans ça.
                if (path) path = decodeURIComponent(path);

                if (bucketName && path) {
                    const { data: blob, error: downloadError } = await supabase.storage
                        .from(bucketName)
                        .download(path);

                    if (!downloadError && blob) {
                        finalImageAnnotation = await blobToBase64(blob);
                    } else {
                        console.error("Erreur téléchargement image:", downloadError);
                    }
                }
            }

            // 2. PRÉPARATION DES DONNÉES PDF
            // On combine observations générales ET observations ostéo pour qu'elles apparaissent toutes les deux
            const combinedObservations = [
                seance.observations ? `Générales : ${seance.observations}` : null,
                seance.observations_osteo ? `Ostéopathiques : ${seance.observations_osteo}` : null
            ].filter(Boolean).join('\n\n');

            const pdfData: SeanceTypePDF = {
                date: seance.date,
                motif: seance.motif,
                observations: combinedObservations, // Utilisation du texte combiné
                recommandations: seance.recommandations,
                suivi: seance.suivi,
                annotation_squelette_url: finalImageAnnotation,
                mesures_avant: {
                    avant_gauche: seance.mesure_ant_gauche_avant?.toString() || '—',
                    avant_droit: seance.mesure_ant_droite_avant?.toString() || '—',
                    arriere_gauche: seance.mesure_post_gauche_avant?.toString() || '—',
                    arriere_droit: seance.mesure_post_droite_avant?.toString() || '—',
                },
                mesures_apres: {
                    avant_gauche: seance.mesure_ant_gauche_apres?.toString() || '—',
                    avant_droit: seance.mesure_ant_droite_apres?.toString() || '—',
                    arriere_gauche: seance.mesure_post_gauche_apres?.toString() || '—',
                    arriere_droit: seance.mesure_post_droite_apres?.toString() || '—',
                }
            }

            const blobPdf = await pdf(
                <CompteRenduPDF
                    seance={pdfData}
                    animalName={seance.animaux?.nom || ''}
                    clientName={seance.animaux?.clients?.nom || ''}
                />
            ).toBlob()

            const url = URL.createObjectURL(blobPdf)
            const a = document.createElement('a')
            a.href = url
            a.download = `compte-rendu_${seance.animaux?.nom || 'animal'}_${seance.date?.slice(0, 10)}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

        } catch (err) {
            console.error("Erreur PDF", err)
            alert("Erreur lors de la création du PDF.")
        } finally {
            setGeneratingPdf(false)
        }
    }

    if (loading) return <EcranDeChargement texte="Chargement de la séance..." />
    if (!seance) return <p className="text-center mt-8 text-[#6E4B42]">Séance introuvable.</p>

    return (
        <div className="min-h-screen bg-[#FFF0F3]">
            <main className="max-w-3xl mx-auto p-6">
                <button
                    onClick={() => router.push(`/mon-espace/avec-menu/animal/${animalId}/osteopathie`)}
                    className="flex items-center text-[#6E4B42] hover:underline mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au dossier ostéopathie
                </button>

                <TitrePrincipal>
                    Séance du {format(new Date(seance.date), 'dd MMMM yyyy', { locale: fr })}
                </TitrePrincipal>

                <div className="bg-white border border-[#B05F63] p-6 rounded-lg shadow-sm text-[#6E4B42] space-y-4 mt-6">
                    <h2 className="font-charm text-xl text-[#B05F63] border-b border-[#B05F63]/30 pb-2 mb-4">Résumé de la consultation</h2>

                    <div>
                        <span className="font-semibold block mb-1">Motif :</span>
                        <p className="bg-gray-50 p-2 rounded text-sm">{seance.motif || '—'}</p>
                    </div>

                    <div>
                        <span className="font-semibold block mb-1">Observations :</span>
                        <div className="bg-gray-50 p-2 rounded text-sm whitespace-pre-line space-y-2">
                            {seance.observations && <p><strong>Générales :</strong> {seance.observations}</p>}
                            {seance.observations_osteo && <p><strong>Ostéopathiques :</strong> {seance.observations_osteo}</p>}
                            {!seance.observations && !seance.observations_osteo && '—'}
                        </div>
                    </div>

                    <div>
                        <span className="font-semibold block mb-1">Recommandations :</span>
                        <p className="bg-gray-50 p-2 rounded text-sm whitespace-pre-line">{seance.recommandations || '—'}</p>
                    </div>

                    {/* Affichage des mesures dans le résumé web */}
                    {(seance.mesure_ant_gauche_avant || seance.mesure_ant_gauche_apres) && (
                        <div className="mt-4">
                            <span className="font-semibold block mb-2">Mesures musculaires :</span>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="bg-gray-50 p-2 rounded">
                                    <p className="font-semibold mb-1">Avant</p>
                                    <p>Ant G: {seance.mesure_ant_gauche_avant ?? '-'}</p>
                                    <p>Ant D: {seance.mesure_ant_droite_avant ?? '-'}</p>
                                    <p>Post G: {seance.mesure_post_gauche_avant ?? '-'}</p>
                                    <p>Post D: {seance.mesure_post_droite_avant ?? '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <p className="font-semibold mb-1">Après</p>
                                    <p>Ant G: {seance.mesure_ant_gauche_apres ?? '-'}</p>
                                    <p>Ant D: {seance.mesure_ant_droite_apres ?? '-'}</p>
                                    <p>Post G: {seance.mesure_post_gauche_apres ?? '-'}</p>
                                    <p>Post D: {seance.mesure_post_droite_apres ?? '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {seance.annotation_squelette_url && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                            <span className="font-semibold block mb-2">Schéma annoté disponible</span>
                            <p className="text-xs text-gray-500 italic">Le schéma sera inclus dans le PDF téléchargeable ci-dessous.</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleDownloadPDF}
                    disabled={generatingPdf}
                    className="w-full flex items-center justify-center gap-2 bg-[#B05F63] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#8E3E42] transition shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {generatingPdf ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Génération du PDF en cours...
                        </>
                    ) : (
                        <>
                            <FileDown className="w-5 h-5" />
                            Télécharger le compte rendu complet (PDF)
                        </>
                    )}
                </button>
            </main>
        </div>
    )
}