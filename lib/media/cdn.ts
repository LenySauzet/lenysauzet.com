import siteConfig from '@/config/site';

const ABSOLUTE = /^https?:\/\//i;

export const resolveMedia = (src: string) =>
  ABSOLUTE.test(src) ? src : `${siteConfig.cdnUrl}/portfolio/${src.replace(/^\/+/, '')}`;
