import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Initialisation de la réponse
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Création du client Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // 3. Récupération de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser();

  // --- LOGIQUE DE PROTECTION ---

  // A. Si l'utilisateur N'EST PAS connecté
  // Et qu'il n'est pas sur la page de connexion ou les routes d'auth
  if (!user && !request.nextUrl.pathname.startsWith('/connexion') && !request.nextUrl.pathname.startsWith('/auth')) {
    // Si on n'est pas à la racine (gérée par page.tsx), on redirige vers /connexion
    if (request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
  }

  // B. Si l'utilisateur EST connecté
  if (user) {
    // On récupère le rôle dans user_metadata (qui correspond à raw_user_meta_data en base)
    const isAdmin = user.user_metadata?.role === 'admin';

    // Protection de la route /admin
    if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
      // Si pas admin, on renvoie vers le dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Si l'utilisateur arrive sur la racine '/', on l'envoie direct au dashboard
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (ton dossier d'assets public)
     * - lottie (tes animations json)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|lottie|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};