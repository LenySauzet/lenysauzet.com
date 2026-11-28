import { withBotId } from 'botid/next/config';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  outputFileTracingIncludes: { '/api/ask': ['./content/knowledge/**/*'] },
  redirects: async () => [{ source: '/en/:path*', destination: '/:path*', permanent: true }],
  rewrites: async () => ({
    beforeFiles: [
      { source: '/', destination: '/en' },
      { source: '/:path((?!(?:en|fr)(?:/|$)|_next/|api/|opengraph-image|.*\\..*).+)', destination: '/en/:path' },
    ],
    afterFiles: [],
    fallback: [],
  }),
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.lenysauzet.com', pathname: '/portfolio/**' }],
  },
};

export default withBotId(createNextIntlPlugin('./i18n/request.ts')(nextConfig));
