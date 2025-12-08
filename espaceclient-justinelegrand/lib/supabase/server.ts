import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createServerSupabase = async () => {
    // CORRECTION MAJEURE : On attend que les cookies soient disponibles (Next.js 15+)
    const cookieStore = await cookies()

    // 1. Récupération sécurisée des variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 2. Vérification (Pour éviter le crash "supabaseKey required" pendant le build Vercel)
    if (!supabaseUrl || !supabaseKey) {
        console.warn("⚠️ Attention : Clés Supabase manquantes. Mode 'placeholder' activé pour le build.")

        // On retourne un client "vide" qui ne plantera pas le build
        return createServerClient<Database>(
            'https://placeholder.supabase.co',
            'placeholder-key',
            {
                cookies: {
                    get: () => undefined,
                    set: () => { },
                    remove: () => { },
                },
            }
        )
    }

    // 3. Création normale du client (Si tout va bien)
    return createServerClient<Database>(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // Ignorer les erreurs d'écriture de cookies dans les Server Components
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.delete({ name, ...options })
                    } catch (error) {
                        // Ignorer
                    }
                },
            },
        }
    )
}