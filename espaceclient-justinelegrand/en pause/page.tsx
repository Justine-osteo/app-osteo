'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, FileText, Star } from 'lucide-react'
import EcranDeChargement from '@/components/ui/EcranDeChargement'

// Type simplifié pour la séance de nutrition
// On ajoutera les détails spécifiques plus tard si besoin
type SeanceDetail = {
    id: string;
    date: string;
    type: 'nutrition';
    animaux: {
        nom: string;
        clients: {
            nom: string;
        } | null;
    } | null;
}

type Questionnaire = {
    id: string;
    type: 'pre'; // En nutrition, c'est surtout le questionnaire pré-séance qui compte
    reponses: any;
}

export default function DetailSeanceNutrition() {
    const router = useRouter()
    // On récupère les paramètres de l'URL de manière sécurisée
    const params = useParams()
    // On gère le cas où params.id ou params.seanceId seraient des tableaux
    const animalId = Array.isArray(params?.id) ? params.id[0] : params?.id as string
    const seanceId = Array.isArray(params?.seanceId) ? params.seanceId[0] : params?.seanceId as string

    const [seance, setSeance] = useState<SeanceDetail | null>(null)
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            if (!seanceId || !animalId) {
                setError("Paramètres manquants.")
                setLoading(false)
                return
            }

            setLoading(true);

            // 1. Récupérer les infos de la séance
            const seancePromise = supabase
                .from('seances')
                .select(`
                    id, date, type,
                    animaux (
                        nom,
                        clients ( nom )
                    )
                `)
                .eq('id', seanceId)
                .single()

            // 2. Récupérer le questionnaire pré-séance
            const questionnairePromise = supabase
                .from('questionnaires')
                .select('id, type, reponses')
                .eq('seance_id', seanceId)
                .eq('type', 'pre')
                .maybeSingle() // maybeSingle car il peut ne pas encore exister

            const [seanceResult, questionnaireResult] = await Promise.all([seancePromise, questionnairePromise]);

            if (seanceResult.error) {
                console.error("Erreur chargement séance:", seanceResult.error)
                setError("Impossible de charger la séance.")
            } else {
                setSeance(seanceResult.data as SeanceDetail)
            }

            if (questionnaireResult.data) {
                setQuestionnaire(questionnaireResult.data as Questionnaire)
            }

            setLoading(false)
        }

        fetchData()
    }, [seanceId, animalId])

    if (loading) return <EcranDeChargement texte="Chargement de la séance..." />
    if (error) return <p className="text-center mt-8 text-red-600">{error}</p>
    if (!seance) return <p className="text-center mt-8">Séance introuvable.</p>

    const statutQuestionnaire = questionnaire && questionnaire.reponses ? 'complété' : 'à compléter'
    const estComplete = statutQuestionnaire === 'complété'

    return (
        <main className="max-w-3xl mx-auto p-6">
            <button
                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animalId}`)} // Retour à la fiche animal (plus logique que le dossier ostéo)
                className="flex items-center text-[#6E4B42] hover:underline mb-4 font-semibold"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la fiche de {seance.animaux?.nom}
            </button>

            <TitrePrincipal>
                Suivi Nutrition - {format(new Date(seance.date), 'dd MMMM yyyy', { locale: fr })}
            </TitrePrincipal>

            <div className="space-y-6 mt-8">

                {/* --- BLOC 1 : Le Questionnaire --- */}
                <div className="bg-white border border-[#B05F63] p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-charm font-bold text-[#6E4B42] mb-4">Étape 1 : Vos informations</h2>
                    <p className="text-gray-600 mb-4">
                        Pour préparer au mieux ce bilan, merci de remplir le questionnaire détaillé sur les habitudes de votre animal.
                    </p>
                    <button
                        onClick={() => router.push(`/mon-espace/avec-menu/animal/${animalId}/nutrition/${seanceId}/questionnaire`)}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition ${estComplete
                                ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                : 'bg-[#FBEAEC] text-[#B05F63] border border-[#B05F63] hover:bg-[#f5d5da]'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        {estComplete ? 'Modifier mes réponses' : 'Remplir le questionnaire'}
                        <span className="ml-2 text-sm font-normal">({statutQuestionnaire})</span>
                    </button>
                </div>

                {/* --- BLOC 2 : Récapitulatif des réponses (Placeholder) --- */}
                {estComplete && (
                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                        <h2 className="text-lg font-charm font-bold text-[#6E4B42] mb-4">Résumé de vos réponses</h2>
                        <p className="text-gray-500 italic text-center">
                            (Le récapitulatif détaillé s'affichera ici prochainement)
                        </p>
                        {/* Ici, nous afficherons plus tard les réponses clés : Poids, Alimentation actuelle, etc. */}
                    </div>
                )}

                {/* --- BLOC 3 : La Recommandation (Lien vers la future page) --- */}
                <div className="bg-[#B05F63] text-white p-8 rounded-lg shadow-md text-center transform transition hover:scale-[1.01] cursor-pointer"
                    onClick={() => router.push(`/mon-espace/avec-menu/animal/${animalId}/nutrition/${seanceId}/recommandation`)} // Lien vers la future page
                >
                    <Star className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                    <h2 className="text-2xl font-charm font-bold mb-2">Justine a fait une recommandation !</h2>
                    <p className="text-lg opacity-90 mb-6">
                        Une analyse personnalisée et des solutions adaptées à {seance.animaux?.nom} vous attendent.
                    </p>
                    <span className="inline-block bg-white text-[#B05F63] font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition">
                        Cliquez ici pour la découvrir
                    </span>
                </div>

            </div>
        </main>
    )
}