import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.lenysauzet.com' },
      { protocol: 'https', hostname: 'blog.lenysauzet.com' },
    ],
  },
};

export default nextConfig;
