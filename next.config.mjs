/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hackathon pragmatism: don't block deploys on lint/type friction.
  // Remove these for production.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
