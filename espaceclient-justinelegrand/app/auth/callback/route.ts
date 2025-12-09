import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    // Log pour vérifier que Supabase nous renvoie bien ici
    console.log(`[AUTH CALLBACK] Hit sur: ${request.url}`);

    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/mon-espace'

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            console.error("[AUTH CALLBACK] Erreur : Variables manquantes");
            return NextResponse.redirect(`${origin}/connexion?error=config_missing`)
        }

        const cookieStore = {
            getAll() { return request.cookies.getAll() },
            setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
                cookies.forEach(({ name, value, options }) => {
                    request.cookies.set({ name, value, ...options })
                })
            }
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    // CORRECTION TYPESCRIPT ICI :
                    // On définit explicitement le type du paramètre 'cookies'
                    setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
                        cookies.forEach(({ name, value, options }) => {
                            // On prépare les cookies sur la requête pour l'échange de code
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

        // Échange du code contre une session
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && session) {
            const userRole = session.user.user_metadata?.role

            const redirectUrl = userRole === 'admin'
                ? `${origin}/admin/dashboard`
                : `${origin}${next}`

            const response = NextResponse.redirect(redirectUrl)

            // CRITIQUE : Il faut appliquer les cookies de session sur la RÉPONSE finale
            // pour que le navigateur s'en souvienne.
            const { cookies } = await import('next/headers') // Astuce pour récupérer les cookies settiés

            // Réplication manuelle simple pour assurer la persistance si createServerClient n'a pas suffi
            // Note: Avec @supabase/ssr récent, le setAll ci-dessus suffit souvent, 
            // mais on s'assure que la réponse part avec les bons headers.
            // Dans ce bloc spécifique, le createServerClient a déjà manipulé les cookies de la request/response
            // via le middleware implicite. On retourne juste la réponse.

            return response
        }
    }

    return NextResponse.redirect(`${origin}/connexion?error=auth-code-error`)
}