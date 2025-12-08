import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from '@/types/supabase'

// 🛑 TEST DE DÉTECTION : Utilisation de l'ancienne convention 'middleware'
// Le fichier doit être nommé middleware.ts et la fonction middleware.
export async function middleware(request: NextRequest) {

  // AJOUT POUR DÉBOGAGE : Vérifier si le middleware est exécuté
  console.log(`[MIDDLEWARE TEST] Interception de la requête: ${request.nextUrl.pathname}`);

  // Crée la réponse initiale. C'est l'objet qui accumulera les cookies à retourner.
  let response = NextResponse.next({
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
        // Logique de correction de Supabase (modifie l'objet 'response')
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
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

  // Récupère le rôle de l'utilisateur de manière sécurisée
  const userRole = user?.user_metadata?.role

  // --- LOGIQUE DE REDIRECTION ---

  // 1. Gestion de la page racine ('/')
  if (pathname === '/') {
    if (user) {
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      return NextResponse.redirect(new URL("/mon-espace", request.url))
    } else {
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

    if (userRole !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/mon-espace"
      return NextResponse.redirect(url)
    }
  }

  // Si aucune condition de redirection n'est remplie, on continue vers la page demandée.
  return response
}

export const config = {
  matcher: ["/", "/mon-espace/:path*", "/admin/:path*", "/auth/callback"],
}