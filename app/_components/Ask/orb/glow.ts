export interface Avatar {
  x: number;
  y: number;
  size: number;
}

export interface Box {
  width: number;
  height: number;
}

type Color = readonly [number, number, number];

const LAVENDER: Color = [0.62, 0.57, 0.78];
const SLATE: Color = [0.56, 0.6, 0.6];
const SILVER: Color = [0.9, 0.92, 0.94];

const EDGE = {
  depth: 0.4,
  startsAbove: 3.2,
  fadeIn: 2,
  strength: 0.6,
};

const ARCH = {
  height: 1.7,
  sharpness: 0.72,
  strength: 0.75,
  tint: 0.3,
};

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

export function edgeAt(x: number, y: number, avatar: Avatar) {
  const above = (avatar.y - y) / avatar.size;
  const along = 1 - smoothstep(EDGE.startsAbove - EDGE.fadeIn, EDGE.startsAbove, above);
  return EDGE.strength * along * Math.exp(-x / (avatar.size * EDGE.depth));
}

export function archAt(x: number, y: number, avatar: Avatar) {
  if (x < 0 || x > avatar.x) return 0;
  const across = x / avatar.x;
  const along = (y - avatar.y) / (avatar.size * ARCH.height);
  const reach = Math.hypot(across, along);
  return ARCH.strength * (1 - smoothstep(ARCH.sharpness, 1, reach)) * (0.45 + 0.55 * across);
}

export function glowAt(x: number, y: number, avatar: Avatar) {
  const edge = edgeAt(x, y, avatar);
  const beam = archAt(x, y, avatar);
  const lower = smoothstep(avatar.y, avatar.y + 3 * avatar.size, y);
  const rim = LAVENDER.map((channel, index) => channel + (SLATE[index]! - channel) * lower);
  const far = smoothstep(0.4, 2, Math.hypot(x - avatar.x, y - avatar.y) / avatar.size) * ARCH.tint;
  const shaft = SILVER.map((channel, index) => channel + (LAVENDER[index]! - channel) * far);
  const total = edge + beam;
  const color = rim.map((channel, index) =>
    total > 0 ? (channel * edge + shaft[index]! * beam) / total : channel
  ) as unknown as Color;
  return { light: Math.min(1, total), color };
}

export function guidePath(avatar: Avatar, box: Box) {
  const half = (avatar.size * ARCH.height).toFixed(1);
  const top = (avatar.y - avatar.size * ARCH.height).toFixed(1);
  const bottom = (avatar.y + avatar.size * ARCH.height).toFixed(1);
  const depth = (avatar.size * EDGE.depth).toFixed(1);
  const start = (avatar.y - EDGE.startsAbove * avatar.size).toFixed(1);
  return `M0,${top}A${avatar.x},${half} 0 0 1 0,${bottom}M${depth},${start}L${depth},${box.height}`;
}

export function paintGlow(image: ImageData, scale: number, avatar: Avatar) {
  const { data, width, height } = image;
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const { light, color } = glowAt((column + 0.5) * scale, (row + 0.5) * scale, avatar);
      const index = (row * width + column) * 4;
      data[index] = color[0] * 255;
      data[index + 1] = color[1] * 255;
      data[index + 2] = color[2] * 255;
      data[index + 3] = light * 255;
    }
  }
}
