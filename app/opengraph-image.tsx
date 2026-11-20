import { ImageResponse } from 'next/og';

import { Logo } from '@/components/shared/Logo';
import siteConfig from '@/config/site';

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div tw="w-full h-full flex items-center justify-center bg-black text-white">
      <Logo width={104} height={104} />
    </div>,
    size
  );
}
