import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Création d'une réponse initiale
  // IMPORTANT : On doit passer 'request' ici pour que Next.js gère bien les headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Ne jamais bloquer le callback Supabase
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // CORRECTION TYPAGE ICI : On explicite le type de 'cookiesToSet'
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Rafraîchir la session si nécessaire
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isClientPage = pathname.startsWith("/mon-espace")
  const isAdminPage = pathname.startsWith("/admin")

  // 🔒 1. Accès client
  if (isClientPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/connexion"
    url.searchParams.set('reason', 'unauthorized')
    return NextResponse.redirect(url)
  }

  // 🔒 2. Accès admin
  if (isAdminPage) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/connexion"
      url.searchParams.set('reason', 'unauthorized')
      return NextResponse.redirect(url)
    }

    if (user.user_metadata.role !== "admin") {
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