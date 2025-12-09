/** @type {import('next').NextConfig} */
const nextConfig = {
    // Application de la Solution 4 de ton article :
    // On utilise Webpack pour définir __dirname comme étant le dossier de travail actuel (process.cwd())
    // Cela permet aux librairies qui dépendent de cette variable de ne pas planter.
    webpack: (config, { webpack }) => {
        config.plugins.push(
            new webpack.DefinePlugin({
                __dirname: JSON.stringify(process.cwd()),
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

export default nextConfig;