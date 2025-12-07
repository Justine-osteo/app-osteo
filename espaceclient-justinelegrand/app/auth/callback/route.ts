import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // On récupère le paramètre "next" pour rediriger l'utilisateur là où il voulait aller,
    // sinon par défaut on l'envoie sur /mon-espace
    const next = searchParams.get('next') ?? '/mon-espace'

    if (code) {
        // Initialisation de Supabase via votre helper serveur
        const supabase = await createServerSupabase()

        // Échange du code temporaire contre une session active
        const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (!sessionError && session) {
            // --- CORRECTION MAJEURE ---
            // Au lieu de faire une requête SQL lente et risquée vers la table 'clients',
            // on lit directement le rôle stocké dans le token de l'utilisateur.
            // C'est ce même rôle qui est utilisé par vos règles de sécurité RLS.
            const userRole = session.user.user_metadata?.role

            if (userRole === 'admin') {
                // C'est un admin -> Direction le tableau de bord admin
                return NextResponse.redirect(`${origin}/admin/dashboard`)
            }

            // C'est un client -> Direction l'espace client (ou l'URL demandée)
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // En cas d'erreur de code ou de session, on renvoie vers la page de login ou d'erreur
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}