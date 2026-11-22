import { ImageResponse } from 'next/og';

import { Logo } from '@/components/shared/Logo';
import siteConfig from '@/config/site';

const { width, height, alt } = siteConfig.shareImage;

export { alt };
export const size = { width, height };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div tw="w-full h-full flex items-center justify-center bg-black text-white">
      <Logo width={104} height={104} />
    </div>,
    size
  );
}
