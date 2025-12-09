'use client'

import { useState } from 'react'
// MODIFICATION : On importe createBrowserClient depuis @supabase/ssr
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function ConnexionPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // MODIFICATION : Initialisation du client avec les variables d'environnement
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleGoogleLogin = async () => {
        setLoading(true)
        try {
            // On récupère dynamiquement l'URL actuelle du site
            const origin = window.location.origin

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Cela va générer: "https://ton-site.com/auth/callback" ou "http://localhost:3000/auth/callback"
                    redirectTo: `${origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (error) throw error

        } catch (error) {
            console.error("Erreur de connexion:", error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
            >
                {loading ? 'Redirection...' : 'Se connecter avec Google'}
            </button>
        </div>
    )
}