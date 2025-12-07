import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Ne jamais bloquer le callback Supabase
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return response
  }

  // Création du client Supabase SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isClientPage = pathname.startsWith("/mon-espace")
  const isAdminPage = pathname.startsWith("/admin")

  // 🔒 1. Accès client : user doit être connecté
  if (isClientPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/connexion"
    // AJOUT : On précise la raison pour afficher le message d'erreur
    url.searchParams.set('reason', 'unauthorized')
    return NextResponse.redirect(url)
  }

  // 🔒 2. Accès admin : user doit être connecté + user_metadata.role = "admin"
  if (isAdminPage) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/connexion"
      // AJOUT : On précise la raison ici aussi
      url.searchParams.set('reason', 'unauthorized')
      return NextResponse.redirect(url)
    }

    if (user.user_metadata.role !== "admin") {
      // Redirection vers l'espace client si utilisateur non-admin
      const url = request.nextUrl.clone()
      url.pathname = "/mon-espace"
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ["/mon-espace/:path*", "/admin/:path*", "/auth/callback"],
}