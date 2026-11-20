import siteConfig from '@/config/site';

const ABSOLUTE = /^https?:\/\//i;

export const resolveImage = (src: string) =>
  ABSOLUTE.test(src) ? src : `${siteConfig.cdnUrl}/portfolio/${src.replace(/^\/+/, '')}`;
