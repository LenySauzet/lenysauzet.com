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
const SILVER: Color = [0.86, 0.9, 0.9];

const EDGE = {
  depth: 0.38,
  startsAbove: 1.8,
  fadeIn: 1,
  strength: 0.7,
};

const BEAM = {
  spread: 0.7,
  reach: 2.2,
  strength: 0.95,
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

export function beamAt(x: number, y: number, avatar: Avatar) {
  const dx = avatar.x - x;
  if (dx <= 0) return 0;
  const angle = Math.atan2(y - avatar.y, dx);
  const distance = Math.hypot(dx, y - avatar.y) / avatar.size;
  return BEAM.strength * Math.exp(-((angle / BEAM.spread) ** 2)) * Math.exp(-distance / BEAM.reach);
}

export function glowAt(x: number, y: number, avatar: Avatar) {
  const edge = edgeAt(x, y, avatar);
  const beam = beamAt(x, y, avatar);
  const lower = smoothstep(avatar.y, avatar.y + 3 * avatar.size, y);
  const rim = LAVENDER.map((channel, index) => channel + (SLATE[index]! - channel) * lower);
  const total = edge + beam;
  const color = rim.map((channel, index) =>
    total > 0 ? (channel * edge + SILVER[index]! * beam) / total : channel
  ) as unknown as Color;
  return { light: Math.min(1, total), color };
}

export function guidePath(avatar: Avatar, box: Box) {
  const rays = [-1, 1].map((side) => {
    const angle = side * BEAM.spread;
    return `M${avatar.x},${avatar.y}L0,${(avatar.y + Math.tan(angle) * avatar.x).toFixed(1)}`;
  });
  const depth = (avatar.size * EDGE.depth).toFixed(1);
  const top = (avatar.y - EDGE.startsAbove * avatar.size).toFixed(1);
  return `${rays.join('')}M${depth},${top}L${depth},${box.height}`;
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
