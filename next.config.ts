import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@grpc/grpc-js', 'firebase-admin'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
  },

  images: {

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd-id-talks-prod.s3.us-west-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pjiobifgcvdapikurlbn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'jrlecaepyoivtplpvwoe.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['@grpc/grpc-js'] = false;
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "grpc-js": false,
        "@grpc/grpc-js": false,
        "fs": false,
        "net": false,
        "tls": false,
        "child_process": false,
        "http2": false,
      };
    }
    return config;
  },
};

export default nextConfig;
