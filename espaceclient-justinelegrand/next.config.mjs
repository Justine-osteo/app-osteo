/** @type {import('next').NextConfig} */
const nextConfig = {
    // SUPPRESSION DE 'serverExternalPackages' :
    // C'était une erreur de le mettre ici pour le Middleware. 
    // En l'enlevant, on permet à Webpack de traiter le paquet @supabase/ssr
    // et donc d'appliquer le correctif ci-dessous.

    webpack: (config, { isServer }) => {
        // Correctif pour l'erreur "__dirname is not defined" dans le Middleware (Edge Runtime)
        // On remplace toute occurrence de __dirname par une chaîne vide.
        config.plugins.push(
            new config.webpack.DefinePlugin({
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
    // Si TypeScript est trop strict pendant le build, on peut décommenter ça :
    // typescript: {
    //   ignoreBuildErrors: true,
    // },
};

export default nextConfig;