/** @type {import('next').NextConfig} */
const nextConfig = {
    // On autorise les images externes (Supabase, Google, etc.)
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