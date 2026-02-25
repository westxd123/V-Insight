const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*', // Bu Vercel'in kendi içinde çözmesini sağlar
      },
    ];
  },
};



export default nextConfig;
