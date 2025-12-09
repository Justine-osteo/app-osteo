/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. On n'utilise PLUS 'serverExternalPackages' pour @supabase/ssr.
    // Cela permet à Webpack de traiter le fichier et d'appliquer notre correctif.

    // 2. Le Correctif "Article Solution" :
    // On injecte manuellement une variable __dirname vide pour tromper la librairie.
    // (Cela fonctionne car tu as désactivé le mode --turbo sur Vercel)
    webpack: (config, { webpack }) => {
        config.plugins.push(
            new webpack.DefinePlugin({
                __dirname: JSON.stringify(''),
            })
        );
        return config;
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};