import 'server-only';

import { cache } from 'react';
import sharp from 'sharp';

export interface ImageMeta {
  width: number;
  height: number;
  placeholder?: string;
}

const FALLBACK: ImageMeta = { width: 1600, height: 900 };
const PLACEHOLDER_WIDTH = 16;
const PROBE_TIMEOUT = 15_000;

async function read(url: string): Promise<ImageMeta> {
  const response = await fetch(url, { signal: AbortSignal.timeout(PROBE_TIMEOUT) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const image = sharp(Buffer.from(await response.arrayBuffer()));
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error('no dimensions in its header');

  const tiny = await image.resize(PLACEHOLDER_WIDTH).webp({ quality: 40 }).toBuffer();
  return { width, height, placeholder: `data:image/webp;base64,${tiny.toString('base64')}` };
}

export const probeImage = cache(async (url: string): Promise<ImageMeta> => {
  try {
    return await read(url);
  } catch (error) {
    console.warn(`[image] ${url} could not be probed, assuming 16:9:`, error instanceof Error ? error.message : error);
    return FALLBACK;
  }
});
