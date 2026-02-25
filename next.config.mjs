/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint hataları yayına çıkmayı engellemesin
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
