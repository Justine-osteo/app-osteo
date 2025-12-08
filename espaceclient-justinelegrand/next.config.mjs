/** @type {import('next').NextConfig} */
const nextConfig = {
    // CORRECTION ULTIME POUR __dirname :
    // On garde serverExternalPackages car c'est recommandé,
    // MAIS on ajoute une configuration Webpack pour définir manuellement '__dirname'
    // à une valeur vide. Cela empêche le crash immédiat dans l'Edge Runtime.
    serverExternalPackages: ['@supabase/ssr'],

    webpack: (config, { webpack }) => {
        config.plugins.push(
            new webpack.DefinePlugin({
                // Remplace toute mention de __dirname par une chaine vide dans le code compilé
                __dirname: JSON.stringify(''),
            })
        );
        return config;
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
}