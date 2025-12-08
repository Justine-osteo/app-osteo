/** @type {import('next').NextConfig} */
const nextConfig = {
    // CORRECTION FINALE :
    // Selon le log Vercel, l'option a été déplacée à la racine et renommée.
    // Cela va empêcher le bundling de @supabase/ssr et corriger l'erreur "__dirname".
    serverExternalPackages: ['@supabase/ssr'],

    // Votre configuration existante pour les images
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // Si TypeScript est trop strict pendant le build, on peut décommenter ça :
    // typescript: {
    //   ignoreBuildErrors: true,
    // },
};

export default nextConfig;