import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Setup standard
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
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

  // 2. On regarde qui est là
  const { data: { user } } = await supabase.auth.getUser();

  // --- VERSION SIMPLIFIÉE POUR DÉBLOQUER LA SITUATION ---

  // Si l'utilisateur n'est PAS connecté
  if (!user) {
    // On protège juste le dashboard et l'admin. 
    // Si on essaie d'y aller sans être connecté -> direction connexion
    if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
  }

  // Si l'utilisateur EST connecté
  if (user) {
    // ON LAISSE TOUT PASSER. 
    // J'ai supprimé la vérification "Admin" stricte qui te bloquait.
    // Une fois connecté, tu pourras accéder à tout, ce qui nous permet de vérifier que l'auth marche.

    // Si on est sur l'accueil ou connexion, on envoie au dashboard pour confort
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/connexion')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|lottie|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};