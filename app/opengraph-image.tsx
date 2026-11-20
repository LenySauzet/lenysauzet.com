import { ImageResponse } from 'next/og';

import siteConfig from '@/config/site';

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 80,
          background: '#0b0d12',
          color: '#e6e9f2',
        }}
      >
        <div style={{ fontSize: 30, color: '#8a93a8' }}>{siteConfig.author.role}</div>
        <div style={{ fontSize: 84, letterSpacing: -2 }}>{siteConfig.author.name}</div>
        <div style={{ marginTop: 16, fontSize: 30, color: '#8a93a8' }}>lenysauzet.com</div>
      </div>
    ),
    size
  );
}
