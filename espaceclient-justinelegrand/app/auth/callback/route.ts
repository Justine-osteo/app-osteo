import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // On récupère "next" ou on redirige par défaut vers l'espace client
    const next = searchParams.get('next') ?? '/mon-espace'

    if (code) {
        // 1. Initialisation EXPLICITE pour éviter l'erreur "No API key found"
        // On n'utilise pas le helper externe pour l'instant pour garantir la stabilité ici.
        const cookieStore = {
            getAll() { return [] },
            setAll() { }
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    // CORRECTION : Typage explicite de 'cookiesToSet' et utilisation de 'options'
                    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set({
                                name,
                                value,
                                ...options,
                            })
                        })
                    },
                },
            }
        )

        // 2. Échange du code contre une session
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && session) {
            // 3. VOTRE LOGIQUE : Vérification du rôle
            const userRole = session.user.user_metadata?.role

            if (userRole === 'admin') {
                // C'est un admin -> Direction le tableau de bord admin
                return NextResponse.redirect(`${origin}/admin/dashboard`)
            }

            // C'est un client (ou autre) -> Direction la page demandée
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Si erreur de code ou pas de session
    return NextResponse.redirect(`${origin}/connexion?error=auth-code-error`)
}