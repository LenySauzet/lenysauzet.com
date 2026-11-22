import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  redirects: async () => [{ source: '/en/:path*', destination: '/:path*', permanent: true }],
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.lenysauzet.com' }],
  },
};

export default createNextIntlPlugin('./i18n/request.ts')(nextConfig);
