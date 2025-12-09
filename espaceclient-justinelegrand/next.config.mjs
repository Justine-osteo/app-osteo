/** @type {import('next').NextConfig} */
const nextConfig = {
    // ON RETIRE TOUT : pas de webpack, pas de serverExternalPackages.
    // On laisse Next.js gérer le bundling de Supabase tout seul.

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