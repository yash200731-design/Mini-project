/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    return [
      {
        source: '/api/py/:path*',
        destination: '/api/py/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
