/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

export const config = {
    matcher: ['/espace-client/:path*'], // Protège toutes les routes sous /espace-client
}
