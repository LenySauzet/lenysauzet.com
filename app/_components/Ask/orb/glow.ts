export interface Avatar {
  x: number;
  y: number;
  size: number;
}

export interface Box {
  width: number;
  height: number;
}

const HAZE = [0.74, 0.67, 0.98] as const;
const SILVER = [0.95, 0.95, 0.98] as const;

const PEAK = 1.15;
const RISE = 2.6;
const FALL = 1.8;
const SOFTNESS = 0.11;

const bell = (value: number, width: number) => Math.exp(-((value / width) ** 2));

export function boundaryAt(y: number, avatar: Avatar) {
  const offset = (y - avatar.y) / avatar.size;
  return avatar.size * PEAK * (offset < 0 ? bell(offset, RISE) : 0.22 + 0.78 * bell(offset, FALL));
}

export function strengthAt(y: number, avatar: Avatar) {
  const offset = (y - avatar.y) / avatar.size;
  return offset < 0 ? bell(offset, RISE) : 0.55 + 0.45 * bell(offset, 1.3);
}

export function glowAt(x: number, y: number, avatar: Avatar) {
  const past = (x - boundaryAt(y, avatar)) / avatar.size;
  const across = 1 / (1 + Math.exp(past / SOFTNESS));
  const distance = Math.hypot(x - avatar.x, y - avatar.y) / avatar.size;
  const rightward = Math.max(0, x - avatar.x) / avatar.size;
  const bloom = bell(distance, 0.85) * bell(rightward, 0.4);
  const light = Math.min(1, across * strengthAt(y, avatar) * 0.66 + bloom * 0.24);
  const white = Math.min(1, 0.1 + bell(distance, 1.1) * 0.85);
  return {
    light,
    color: HAZE.map((channel, index) => channel + (SILVER[index]! - channel) * white) as [number, number, number],
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
      data[index + 3] = light * 0.85 * 255;
    }
  }
}
