export interface Avatar {
  x: number;
  y: number;
  size: number;
}

export interface Box {
  width: number;
  height: number;
}

const LAVENDER = [0.66, 0.56, 0.98] as const;
const SILVER = [0.93, 0.93, 0.99] as const;

const PEAK = 1.15;
const RISE = 1.35;
const FALL = 1.6;
const FLOOR = 0.2;
const EDGE_SOFTNESS = 0.32;

export function boundaryAt(y: number, avatar: Avatar) {
  const offset = (y - avatar.y) / avatar.size;
  return offset < 0
    ? avatar.size * (0.04 + PEAK * Math.exp(-((offset / RISE) ** 2)))
    : avatar.size * (FLOOR + (PEAK - FLOOR) * Math.exp(-offset / FALL));
}

export function strengthAt(y: number, avatar: Avatar) {
  const offset = (y - avatar.y) / avatar.size;
  return offset < 0 ? Math.exp(-((offset / 1.25) ** 2)) : 0.45 + 0.55 * Math.exp(-offset / 1.1);
}

export function glowAt(x: number, y: number, avatar: Avatar) {
  const reach = boundaryAt(y, avatar);
  const past = x - reach;
  const across =
    past <= 0 ? 0.75 + 0.25 * Math.exp(past / Math.max(reach, 1)) : Math.exp(-((past / (avatar.size * EDGE_SOFTNESS)) ** 2));
  const distance = Math.hypot(x - avatar.x, y - avatar.y) / avatar.size;
  const sheet = across * strengthAt(y, avatar);
  const rightward = Math.max(0, x - avatar.x) / avatar.size;
  const bloom = Math.exp(-((distance / 0.85) ** 2)) * Math.exp(-((rightward / 0.4) ** 2));
  const light = Math.min(1, sheet * 0.65 + bloom * 0.42);
  const white = Math.min(1, Math.exp(-distance / 0.8) * 0.9 + bloom * 0.2);
  return {
    light,
    color: LAVENDER.map((channel, index) => channel + (SILVER[index]! - channel) * white) as [number, number, number],
  };
}

export function boundaryPath(avatar: Avatar, box: Box, step = 4) {
  const points: string[] = [];
  for (let y = 0; y <= box.height; y += step) points.push(`${boundaryAt(y, avatar).toFixed(1)},${y}`);
  return `M${points.join('L')}`;
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
      data[index + 3] = light * 0.9 * 255;
    }
  }
}
