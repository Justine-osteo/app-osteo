'use client'

import { useState, useEffect, Suspense } from 'react';
// MODIFICATION : On utilise le bon import pour Supabase SSR côté client
import { createBrowserClient } from '@supabase/ssr'
import TitrePrincipal from '@/components/ui/TitrePrincipal';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Info } from 'lucide-react';

// Petit composant wrapper pour utiliser useSearchParams sans bloquer le build
function LoginForm() {
    // MODIFICATION : Initialisation correcte du client Supabase
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();

    // 1. Détection de la raison de la redirection (via l'URL)
    useEffect(() => {
        const errorType = searchParams.get('error');
        const reason = searchParams.get('reason');
        if (errorType === 'access_denied' || reason === 'unauthorized') {
            setMessage({
                type: 'error',
                text: "Accès refusé. Vous devez être connecté ou avoir les droits administrateur pour accéder à cette page."
            });
        } else if (reason === 'session_expired') {
            setMessage({
                type: 'info',
                text: "Votre session a expiré par sécurité. Veuillez vous reconnecter."
            });
        }
    }, [searchParams]);

    // 2. Fonction de traduction des erreurs Supabase
    const traduireErreur = (erreurAnglais: string) => {
        const lowerError = erreurAnglais.toLowerCase();
        if (lowerError.includes('invalid email') || lowerError.includes('unable to validate email')) {
            return "L'adresse email est invalide ou mal formatée.";
        }
        if (lowerError.includes('rate limit')) {
            return "Trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.";
        }
        if (lowerError.includes('signups not allowed')) {
            return "Les inscriptions sont fermées. Contactez votre ostéopathe si vous êtes déjà client.";
        }
        // Fallback : on retourne l'erreur telle quelle si on ne la connait pas
        return `Erreur : ${erreurAnglais}`;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Empêche le rechargement de page
        setLoading(true);
        setMessage(null);

        // Récupération dynamique de l'URL (localhost ou prod)
        const origin = window.location.origin;

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // Pour Magic Link (OTP), le paramètre est bien 'emailRedirectTo'
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        setLoading(false);
        if (error) {
            setMessage({
                type: 'error',
                text: traduireErreur(error.message)
            });
        } else {
            setMessage({
                type: 'success',
                text: 'Un email de connexion a été envoyé. Vérifiez votre boîte mail (et vos spams) !'
            });
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 border border-[#B05F63] rounded-xl shadow-lg bg-white">
            <TitrePrincipal>Connexion Espace Client</TitrePrincipal>

            {/* Affichage des messages (Erreur, Succès, Info) */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                    {message.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0" />}
                    {message.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
                    <p>{message.text}</p>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse email
                    </label>
                    <input
                        id="email"
                        type="email"
                        placeholder="votre-email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B05F63] focus:border-transparent outline-none transition"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-[#B05F63] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#8E3E42] transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center"
                >
                    {loading ? 'Envoi en cours...' : 'Recevoir mon lien de connexion'}
                </button>
            </form>
            <p className="mt-6 text-center text-xs text-gray-400">
                Pas de mot de passe à retenir. Nous vous envoyons un lien sécurisé par email.
            </p>
        </div>
    );
}

// Page principale qui enveloppe le formulaire dans Suspense
export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-center p-10">Chargement...</div>}>
            <LoginForm />
        </Suspense>
    )
}