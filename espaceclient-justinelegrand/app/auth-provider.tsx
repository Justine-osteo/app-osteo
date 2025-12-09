'use client';

import { useEffect, useState } from 'react';
import Loading from 'components/loading';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// On crée un client Supabase juste pour ce composant si besoin, 
// ou on pourrait utiliser ton hook useSupabase() si ce composant est bien placé dans l'arbre.
// Pour être sûr que ça marche sans erreur de contexte, je le recrée ici localement.

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Initialisation du client Supabase
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const checkUser = async () => {
            try {
                // 1. On demande à Supabase : "Y a-t-il une session active ?"
                const { data: { session } } = await supabase.auth.getSession();

                // 2. Si pas de session et qu'on n'est pas sur la page login, on peut gérer ici
                // Mais normalement le Middleware fait déjà le travail de redirection.
                // Ce composant sert surtout à "attendre" la réponse de Supabase avant d'afficher la page.

                if (!session && pathname !== '/login') {
                    // Optionnel : Double sécurité si le middleware rate
                    // router.push('/login'); 
                }

            } catch (error) {
                console.error('Erreur auth:', error);
            } finally {
                // 3. Quoi qu'il arrive (connecté ou pas), on arrête le chargement
                setLoading(false);
            }
        };

        checkUser();

        // On écoute les changements (ex: si l'utilisateur se déconnecte dans un autre onglet)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/login'); // Redirection immédiate si on clique "Se déconnecter"
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname, supabase]);

    if (loading) {
        return <Loading />;
    }

    return <>{children}</>;
}