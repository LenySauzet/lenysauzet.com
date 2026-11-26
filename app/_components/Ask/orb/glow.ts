export interface Point {
  x: number;
  y: number;
}

export interface Box {
  width: number;
  height: number;
}

const LAVENDER = [0.68, 0.58, 0.98] as const;
const SILVER = [0.93, 0.93, 0.99] as const;

const EDGE = 6;
const PAST_AVATAR = 10;
const RISE = 0.16;
const TAPER = 36;
const SOFT_EDGE = 22;
const CORE = 38;
const RADIATE = 95;

export function boundaryAt(y: number, avatar: Point, box: Box) {
  const offset = y - avatar.y;
  const peak = avatar.x + PAST_AVATAR;
  return offset < 0
    ? EDGE + (peak - EDGE) * Math.exp(offset / (box.height * RISE))
    : EDGE + (peak - EDGE) * Math.exp(-offset / TAPER);
}

export function strengthAt(y: number, avatar: Point, box: Box) {
  const offset = y - avatar.y;
  return offset < 0 ? Math.exp(offset / (box.height * 0.18)) : Math.exp(-offset / (TAPER * 1.5));
}

export function glowAt(x: number, y: number, avatar: Point, box: Box) {
  const reach = boundaryAt(y, avatar, box);
  const past = x - reach;
  const across = past <= 0 ? 0.72 + 0.28 * Math.exp(past / Math.max(reach, 1)) : Math.exp(-((past / SOFT_EDGE) ** 1.6));
  const distance = Math.hypot(x - avatar.x, y - avatar.y);
  const sheet = across * strengthAt(y, avatar, box) * (0.3 + 0.7 * Math.exp(-distance / RADIATE));
  const core = Math.exp(-((distance / CORE) ** 2) / 2);
  const light = Math.min(1, sheet * 0.45 + core * 0.14);
  const white = Math.min(1, core * 0.7 + 0.35 * Math.exp(-distance / 90));
  return {
    light,
    color: LAVENDER.map((channel, index) => channel + (SILVER[index]! - channel) * white) as [number, number, number],
  };
}

export function boundaryPath(avatar: Point, box: Box, step = 4) {
  const points: string[] = [];
  for (let y = 0; y <= box.height; y += step) points.push(`${boundaryAt(y, avatar, box).toFixed(1)},${y}`);
  return `M${points.join('L')}`;
}

export function paintGlow(image: ImageData, scale: number, avatar: Point, box: Box) {
  const { data, width, height } = image;
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const { light, color } = glowAt((column + 0.5) * scale, (row + 0.5) * scale, avatar, box);
      const index = (row * width + column) * 4;
      data[index] = color[0] * 255;
      data[index + 1] = color[1] * 255;
      data[index + 2] = color[2] * 255;
      data[index + 3] = light * 0.48 * 255;
    }
  }
}
