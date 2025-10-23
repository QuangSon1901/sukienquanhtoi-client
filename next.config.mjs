/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'salt.tkbcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'img.upanh.tv',
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
