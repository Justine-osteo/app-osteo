import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Setup initial de la réponse et du client Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 2. Récupération de l'utilisateur et de ses métadonnées (rôles)
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // --- CAS 1 : UTILISATEUR NON CONNECTÉ ---
  if (!user) {
    const publicPaths = ['/connexion', '/auth/callback', '/inscription', '/forgot-password'];
    const isPublic = publicPaths.some(path => url.pathname.startsWith(path));

    // Protection : si la route n'est pas publique, redirection vers connexion
    if (!isPublic && url.pathname !== '/') {
      url.pathname = '/connexion';
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // --- CAS 2 : UTILISATEUR CONNECTÉ ---
  if (user) {
    const userRole = user.user_metadata?.role;

    // Définition des destinations selon le rôle
    const adminDestination = '/admin/dashboard';
    const userDestination = '/mon-espace';

    // Pages dont on veut rediriger l'utilisateur connecté (login, racine, etc.)
    const pathsToRedirectAwayFrom = ['/connexion', '/'];

    // Aiguillage principal : Si l'utilisateur est sur une page de login ou la racine
    if (pathsToRedirectAwayFrom.includes(url.pathname)) {
      if (userRole === 'admin') {
        url.pathname = adminDestination;
      } else {
        url.pathname = userDestination;
      }
      // On nettoie les paramètres d'URL (comme le ?code= du callback) avant la redirection finale
      url.searchParams.delete('code');
      url.searchParams.delete('next');
      return NextResponse.redirect(url);
    }

    // Sécurité additionnelle : Protéger les routes /admin contre les non-admins
    if (url.pathname.startsWith('/admin') && userRole !== 'admin') {
      url.pathname = userDestination;
      return NextResponse.redirect(url);
    }
  }

  // 4. Retourner la réponse modifiée (avec cookies mis à jour)
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};