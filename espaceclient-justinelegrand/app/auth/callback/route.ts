import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    console.log('🔹 [CALLBACK START] Code présent:', !!code, '| Redirection prévue vers:', next);

    if (code) {
        // IMPORTANT : await cookies() est nécessaire dans les versions récentes de Next.js
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // On ignore l'erreur si on ne peut pas set le cookie (ex: server component strict)
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.delete({ name, ...options });
                        } catch (error) {
                            // Idem
                        }
                    },
                },
            }
        );

        // Tentative d'échange du code contre une session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('🔴 [CALLBACK ERROR] Échec échange code:', error.message);
            // Redirection vers connexion avec le message d'erreur
            return NextResponse.redirect(`${origin}/connexion?error=${encodeURIComponent(error.message)}`);
        }

        // Succès
        console.log('🟢 [CALLBACK SUCCESS] Session créée pour User ID:', data.session?.user?.id);

        // Redirection finale
        return NextResponse.redirect(`${origin}${next}`);
    }

    console.warn('🟠 [CALLBACK WARN] Pas de code fourni dans l\'URL');
    // En cas d'absence de code
    return NextResponse.redirect(`${origin}/connexion?error=no-code`);
}