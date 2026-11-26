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

const SILVER: Color = [0.86, 0.88, 0.92];
const LAVENDER: Color = [0.66, 0.62, 0.82];

const SPREAD = 2.2;
const DEPTH = 0.7;
const MIN_DEPTH = 0.3;
const STRENGTH = 0.68;

export function curveAt(y: number, avatar: Avatar) {
  const offset = (y - avatar.y) / (avatar.size * SPREAD);
  return Math.exp(-0.5 * offset * offset);
}

export function depthAt(y: number, avatar: Avatar) {
  return avatar.size * DEPTH * (MIN_DEPTH + (1 - MIN_DEPTH) * curveAt(y, avatar));
}

export function glowAt(x: number, y: number, avatar: Avatar) {
  const curve = curveAt(y, avatar);
  const light = STRENGTH * curve * Math.exp(-Math.max(x, 0) / depthAt(y, avatar));
  const color = LAVENDER.map((channel, index) => channel + (SILVER[index]! - channel) * curve) as unknown as Color;
  return { light, color };
}

export function guidePath(avatar: Avatar, box: Box, step = 4) {
  const points: string[] = [];
  for (let y = 0; y <= box.height; y += step) points.push(`${depthAt(y, avatar).toFixed(1)},${y}`);
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
      data[index + 3] = light * 255;
    }
  }
}
