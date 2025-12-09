/** @type {import('next').NextConfig} */
const nextConfig = {
    // On laisse Next.js gérer tout tout seul.
    // Pas de configuration complexe ici.

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