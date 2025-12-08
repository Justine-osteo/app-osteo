/** @type {import('next').NextConfig} */
const nextConfig = {
    // On utilise la clé standard pour éviter le bundling de paquets problématiques.
    // Cette option est nativement supportée par Turbopack et Webpack.
    serverExternalPackages: ['@supabase/ssr'],

    // ⚠️ IMPORTANT : J'ai supprimé le bloc 'webpack' car il faisait planter Turbopack.
    // Si l'erreur "__dirname" revient, vous devrez changer votre commande de build 
    // sur Vercel : remplacez "next build --turbo" par "next build" pour désactiver Turbopack.

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;