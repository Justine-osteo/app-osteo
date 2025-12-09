// 1. IMPORT DU CORRECTIF (Toujours en premier)
import './polyfill'

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {

  try {
    let response = NextResponse.next({
      request: { headers: request.headers },
    })

    // Récupération sécurisée des variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variables d'environnement Supabase manquantes (URL ou KEY).");
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
    const { data: { user }, error } = await supabase.auth.getUser()

    // Si une erreur Supabase survient (hors "non connecté"), on peut vouloir la voir
    if (error && error.message !== "Auth session missing!") {
      console.error("Supabase Error:", error);
    }

    const pathname = request.nextUrl.pathname
    const userRole = user?.user_metadata?.role

    // --- REDIRECTIONS ---
    if (pathname === '/') {
      if (user) {
        return NextResponse.redirect(new URL(userRole === "admin" ? "/admin" : "/mon-espace", request.url))
      }
      return NextResponse.redirect(new URL("/connexion", request.url))
    }

    if (pathname.startsWith("/admin")) {
      if (!user || userRole !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = (!user) ? "/connexion" : "/mon-espace"
        url.searchParams.set('reason', 'unauthorized')
        return NextResponse.redirect(url)
      }
    }

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
    // 🛑 ICI : AU LIEU DE FAIRE 404, ON AFFICHE L'ERREUR
    return NextResponse.json(
      {
        status: "Error caught in middleware",
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: ["/", "/mon-espace/:path*", "/admin/:path*", "/auth/callback"],
}