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
  const { data: { user } } = await supabase.auth.getUser();

  // --- ZONE DE DEBUG (AFFICHE DANS LE TERMINAL SERVEUR) ---
  console.log('------------------------------------------------');
  console.log('>>> DEBUG MIDDLEWARE : ', request.nextUrl.pathname);
  if (user) {
    console.log('>>> USER CONNECTÉ :', user.email);
    console.log('>>> USER METADATA :', user.user_metadata);
    console.log('>>> APP METADATA :', user.app_metadata);
  } else {
    console.log('>>> AUCUN USER DÉTECTÉ (user is null)');
  }
  console.log('------------------------------------------------');
  // ---------------------------------------------------------

  // --- TES RÈGLES ---

  // RÈGLE 1 : Si PAS connecté (user est null)
  if (!user) {
    // Si on essaie d'aller ailleurs que sur la page de connexion, l'auth ou l'accueil
    if (
      !request.nextUrl.pathname.startsWith('/connexion') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      request.nextUrl.pathname !== '/'
    ) {
      console.log('>>> REDIRECTION : Pas connecté -> vers /connexion');
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
  }

  // RÈGLE 2 : Si CONNECTÉ
  if (user) {
    // Vérification du rôle admin : On regarde dans user_metadata ET app_metadata pour être sûr
    const isAdmin =
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin';

    console.log('>>> IS ADMIN ?', isAdmin); // Debug rôle

    // Protection de la route /admin
    if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
      console.log('>>> REDIRECTION : Tentative accès Admin sans droits -> vers /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirection automatique de l'accueil vers le dashboard
    if (request.nextUrl.pathname === '/') {
      console.log('>>> REDIRECTION : Accueil -> vers /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Si on est connecté et qu'on essaie d'aller sur /connexion -> on renvoie au dashboard
    if (request.nextUrl.pathname.startsWith('/connexion')) {
      console.log('>>> REDIRECTION : Déjà connecté sur page login -> vers /dashboard');
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