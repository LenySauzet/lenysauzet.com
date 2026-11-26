export interface Point {
  x: number;
  y: number;
}

export interface Box {
  width: number;
  height: number;
}

const LAVENDER = [0.7, 0.6, 0.98] as const;
const SILVER = [0.93, 0.93, 0.99] as const;

const CORE = 30;

const widest = (box: Box) => Math.min(box.width * 0.45, 220);

export function reachAt(y: number, avatar: Point, box: Box) {
  const offset = y - avatar.y;
  const most = widest(box);
  return offset < 0
    ? 16 + most * Math.exp(offset / (box.height * 0.36))
    : 36 + most * 0.75 * Math.exp(-offset / (box.height * 0.3));
}

export function strengthAt(y: number, avatar: Point, box: Box) {
  const offset = y - avatar.y;
  return offset < 0 ? Math.exp(offset / (box.height * 0.4)) : 0.55 + 0.45 * Math.exp(-offset / 70);
}

export function glowAt(x: number, y: number, avatar: Point, box: Box) {
  const along = Math.exp(-Math.pow(Math.max(x, 0) / reachAt(y, avatar, box), 1.6)) * strengthAt(y, avatar, box);
  const distance = (x - avatar.x) ** 2 + (y - avatar.y) ** 2;
  const core = Math.exp(-distance / (2 * CORE * CORE));
  const light = Math.min(1, along * 0.8 + core * 0.22);
  const white = Math.min(1, core * 0.9 + along * along * 0.4);
  return {
    light,
    color: LAVENDER.map((channel, index) => channel + (SILVER[index]! - channel) * white) as [number, number, number],
  };
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
      data[index + 3] = light * 0.6 * 255;
    }
  }
}
