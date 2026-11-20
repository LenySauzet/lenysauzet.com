import 'server-only';

import { imageSize } from 'image-size';
import { cache } from 'react';

const HEADER_BYTES = 65_535;

export interface Dimensions {
  width: number;
  height: number;
}

const FALLBACK: Dimensions = { width: 1600, height: 900 };

async function read(url: string): Promise<Dimensions> {
  const response = await fetch(url, { headers: { Range: `bytes=0-${HEADER_BYTES}` } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const { width, height } = imageSize(new Uint8Array(await response.arrayBuffer()));
  if (!width || !height) throw new Error('no dimensions in its header');

  return { width, height };
}

export const measureImage = cache(async (url: string): Promise<Dimensions> => {
  try {
    return await read(url);
  } catch (error) {
    console.warn(`[image] ${url} could not be measured, assuming 16:9:`, error instanceof Error ? error.message : error);
    return FALLBACK;
  }
});
