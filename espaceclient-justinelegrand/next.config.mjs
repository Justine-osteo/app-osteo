/** @type {import('next').NextConfig} */
const nextConfig = {
    // Correction de l'erreur "ReferenceError: __dirname is not defined"
    // Cela empêche Next.js de mal empaqueter @supabase/ssr pour l'environnement Edge
    experimental: {
        serverComponentsExternalPackages: ['@supabase/ssr'],
    },

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