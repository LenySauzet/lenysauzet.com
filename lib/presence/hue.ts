const SEED = 31;

export const hueOf = (id: string) =>
  [...id].reduce((hash, character) => (hash * SEED + character.charCodeAt(0)) % 360, 0);

const oklch = (lightness: string, id: string, alpha: number) =>
  `oklch(var(${lightness}) var(--cursor-chroma) ${hueOf(id)} / ${alpha})`;

export const tintOf = (id: string, alpha: number) => oklch('--cursor-lightness', id, alpha);

export const inkOf = (id: string) => oklch('--cursor-ink-lightness', id, 1);
