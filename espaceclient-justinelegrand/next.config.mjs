/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. On garde l'exclusion du paquet pour éviter les conflits d'import
    serverExternalPackages: ['@supabase/ssr'],

    // 2. LE CORRECTIF ULTIME (nécessite "next build" sans --turbo)
    // On utilise Webpack pour définir globalement la variable manquante.
    webpack: (config, { webpack }) => {
        config.plugins.push(
            new webpack.DefinePlugin({
                // Ceci remplace toute mention de __dirname par "" dans le code final
                __dirname: JSON.stringify(''),
            })
        );
        return config;
    },

    // Ta config d'images existante
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