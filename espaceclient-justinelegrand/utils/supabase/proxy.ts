import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr' // Import de 'CookieOptions'
import type { Database } from '@/types/supabase'

export async function proxy(request: NextRequest) {
    const response = NextResponse.next()

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                // Correction de l'erreur 'any' implicite
                setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => {
                    cookies.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // rafraîchir les tokens (important pour garder les cookies à jour)
    await supabase.auth.getSession()

    return response
}

export const config = {
    // Le matcher doit correspondre aux routes de votre application nécessitant l'authentification
    // Le chemin '/mon-espace/:path*' est typique pour les zones sécurisées.
    matcher: ['/mon-espace/:path*'],
}