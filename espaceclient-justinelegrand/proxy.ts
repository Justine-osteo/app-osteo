import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from '@/types/supabase'

// 🛑 NOUVEAU NOM DE CONVENTION: La fonction DOIT être nommée 'proxy' selon les dernières
// recommandations de Next.js pour le Global Proxy Handler.
export async function proxy(request: NextRequest) {

  // Crée la réponse initiale. C'est l'objet qui accumulera les cookies à retourner.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Ne jamais bloquer le callback Supabase
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return response
  }

  // Crée le client Supabase Server Side
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // CORRECTION DE LA LOGIQUE: On modifie la variable 'response' sans la recréer.
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Modification directe de l'objet 'response'
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Rafraîchir la session et obtenir l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isClientPage = pathname.startsWith("/mon-espace")
  const isAdminPage = pathname.startsWith("/admin")

  // --- LOGIQUE DE REDIRECTION ---

  // 1. Gestion de la page racine ('/')
  if (pathname === '/') {
    if (user) {
      // Utilisateur connecté: Rediriger vers l'espace approprié
      if (user.user_metadata.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      return NextResponse.redirect(new URL("/mon-espace", request.url))
    } else {
      // Utilisateur non connecté: Rediriger vers la page de connexion
      return NextResponse.redirect(new URL("/connexion", request.url))
    }
  }


  // 🔒 2. Accès client
  if (isClientPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/connexion"
    url.searchParams.set('reason', 'unauthorized')
    return NextResponse.redirect(url)
  }

  // 🔒 3. Accès admin
  if (isAdminPage) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/connexion"
      url.searchParams.set('reason', 'unauthorized')
      return NextResponse.redirect(url)
    }

    // Vérification du rôle
    if (user.user_metadata.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/mon-espace"
      return NextResponse.redirect(url)
    }
  }

  // Retourne la réponse modifiée (avec les cookies mis à jour si nécessaire)
  return response
}

export const config = {
  // Le matcher doit inclure toutes les routes sous surveillance.
  matcher: ["/", "/mon-espace/:path*", "/admin/:path*", "/auth/callback"],
}