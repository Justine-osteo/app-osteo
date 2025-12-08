/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ignore les erreurs TypeScript pendant le build (pour Vercel)
    typescript: {
        ignoreBuildErrors: true,
    },
    // Ignore les erreurs ESLint pendant le build
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Autorise toutes les images externes (Supabase, Unsplash, etc.)
            },
        ],
    },
};

export default nextConfig;