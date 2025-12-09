// 1. IMPORT DU CORRECTIF EN TOUT PREMIER (C'est ça qui "remplace" le fichier manquant)
import './polyfill'

// 2. Ensuite les imports normaux
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {

  // LOG DE DÉMARRAGE
  console.log(`[MIDDLEWARE START] ${request.nextUrl.pathname}`);

  try {
    let response = NextResponse.next({
      request: { headers: request.headers },
    })

    // Récupération sécurisée des variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[MIDDLEWARE ERROR] Variables manquantes !");
      // On continue quand même pour ne pas bloquer le site, mais sans auth
      return response;
    }

    if (request.nextUrl.pathname.startsWith("/auth/callback")) {
      return response
    }

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Rafraîchir la session
    const { data: { user } } = await supabase.auth.getUser()

    // Logique de redirection simplifiée et robuste
    const pathname = request.nextUrl.pathname
    const userRole = user?.user_metadata?.role

    // 1. Racine -> Redirection
    if (pathname === '/') {
      if (user) {
        return NextResponse.redirect(new URL(userRole === "admin" ? "/admin" : "/mon-espace", request.url))
      }
      return NextResponse.redirect(new URL("/connexion", request.url))
    }

    // 2. Protection Admin
    if (pathname.startsWith("/admin")) {
      if (!user || userRole !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = (!user) ? "/connexion" : "/mon-espace"
        if (!user) url.searchParams.set('reason', 'unauthorized')
        return NextResponse.redirect(url)
      }
    }

    // 3. Protection Client
    if (pathname.startsWith("/mon-espace")) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/connexion"
        url.searchParams.set('reason', 'unauthorized')
        return NextResponse.redirect(url)
      }
    }

    return response

  } catch (error: any) {
    console.error("[MIDDLEWARE CRASH]", error);
    // En cas de crash, on laisse passer la requête plutôt que de faire un écran d'erreur 500
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/", "/mon-espace/:path*", "/admin/:path*", "/auth/callback"],
}