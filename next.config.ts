
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Changed to false for better error visibility
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Added for local development if images are served by Next.js dev server
      // This is typically not needed if images are in `public` and referenced correctly
      // or if they are imported.
      // {
      //   protocol: 'http',
      //   hostname: 'localhost',
      // }
    ],
  },
};

export default nextConfig;

    