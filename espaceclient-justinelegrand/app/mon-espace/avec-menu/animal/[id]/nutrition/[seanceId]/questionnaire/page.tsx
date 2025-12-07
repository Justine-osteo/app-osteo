import { createServerSupabase } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import QuestionnaireChien from '@/components/questionnaires/QuestionnaireChien'
import QuestionnaireChat from '@/components/questionnaires/QuestionnaireChat'
import TitrePrincipal from '@/components/ui/TitrePrincipal'

export default async function PageQuestionnaireNutrition({ params }: { params: { id: string, seanceId: string } }) {
    const { seanceId } = params
    const supabase = await createServerSupabase()

    // 1. Vérifier l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return redirect('/connexion')
    }

    // 2. Récupérer la séance et l'espèce de l'animal
    const { data: seance, error: seanceError } = await supabase
        .from('seances')
        .select(`
            id,
            animaux ( 
                id, 
                nom, 
                espece,
                clients ( auth_id )
            )
        `)
        .eq('id', seanceId)
        .single()

    if (seanceError || !seance || !seance.animaux) {
        console.error("Erreur ou séance introuvable:", seanceError)
        return notFound()
    }

    // 3. Sécurité : Vérifier que le client connecté est bien le propriétaire
    if (seance.animaux.clients?.auth_id !== user.id) {
        return (
            <main className="max-w-3xl mx-auto p-6 text-center">
                <TitrePrincipal>Accès non autorisé</TitrePrincipal>
                <p className="text-red-600">Vous n'avez pas la permission de voir ce questionnaire.</p>
            </main>
        )
    }

    // 4. Récupérer les réponses existantes (s'il y en a)
    const { data: questionnaire } = await supabase
        .from('questionnaires')
        .select('reponses')
        .eq('seance_id', seanceId)
        .eq('type', 'pre')
        .maybeSingle()

    const initialReponses = questionnaire?.reponses as Record<string, any> || {}
    const animalNom = seance.animaux.nom
    const espece = seance.animaux.espece?.toLowerCase()

    // 5. Aiguiller vers le bon composant
    if (espece === 'chien') {
        return <QuestionnaireChien
            seanceId={seanceId}
            animalNom={animalNom}
            initialReponses={initialReponses}
        />
    }

    if (espece === 'chat') {
        return <QuestionnaireChat
            seanceId={seanceId}
            animalNom={animalNom}
            initialReponses={initialReponses}
        />
    }

    return (
        <main className="max-w-3xl mx-auto p-6 text-center">
            <TitrePrincipal>Erreur</TitrePrincipal>
            <p className="text-gray-600">L'espèce de cet animal ({espece}) n'est pas prise en charge pour ce questionnaire.</p>
        </main>
    )
}