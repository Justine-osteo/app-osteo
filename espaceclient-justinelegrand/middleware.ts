import './polyfill'; // <--- Import du polyfill réintégré ici
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Initialisation standard de la réponse
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Configuration du client Supabase
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
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 3. On récupère l'utilisateur connecté
  // Note : getUser() valide le token côté serveur. Si le token est périmé, user sera null.
  const { data: { user } } = await supabase.auth.getUser();

  // --- TES RÈGLES ---

  // RÈGLE 1 : Si PAS connecté (user est null)
  if (!user) {
    // Si on essaie d'aller ailleurs que sur la page de connexion, l'auth ou l'accueil
    if (
      !request.nextUrl.pathname.startsWith('/connexion') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      request.nextUrl.pathname !== '/'
    ) {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
  }

  // RÈGLE 2 : Si CONNECTÉ
  if (user) {
    // Vérification du rôle admin : On regarde dans user_metadata ET app_metadata pour être sûr
    const isAdmin =
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin';

    // Protection de la route /admin
    if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
      // Si pas admin, on renvoie au dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirection automatique de l'accueil vers le dashboard
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Si on est connecté et qu'on essaie d'aller sur /connexion -> on renvoie au dashboard
    if (request.nextUrl.pathname.startsWith('/connexion')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Exclure les fichiers statiques, images, favicon, assets et lottie du middleware
    '/((?!_next/static|_next/image|favicon.ico|assets|lottie|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};