export interface Avatar {
  x: number;
  y: number;
}

const LAVENDER = [0.7, 0.6, 0.98] as const;
const SILVER = [0.93, 0.93, 0.99] as const;

const ABOVE_REACH = 78;
const BELOW_REACH = 70;
const CORE = 26;

export function reachAt(y: number, avatar: Avatar) {
  const offset = y - avatar.y;
  return offset < 0 ? 14 + 150 * Math.exp(offset / ABOVE_REACH) : 40 + 124 * Math.exp(-offset / BELOW_REACH);
}

export function strengthAt(y: number, avatar: Avatar) {
  const offset = y - avatar.y;
  return offset < 0 ? Math.exp(offset / 95) : 0.5 + 0.5 * Math.exp(-offset / 50);
}

export function glowAt(x: number, y: number, avatar: Avatar) {
  const along = Math.exp(-Math.pow(Math.max(x, 0) / reachAt(y, avatar), 2.2)) * strengthAt(y, avatar);
  const distance = (x - avatar.x) ** 2 + (y - avatar.y) ** 2;
  const core = Math.exp(-distance / (2 * CORE * CORE));
  const light = Math.min(1, along * 0.5 + core * 0.45);
  const white = Math.min(1, core * 1.3 + along * along * 0.5);
  return {
    light,
    color: LAVENDER.map((channel, index) => channel + (SILVER[index]! - channel) * white) as [number, number, number],
  };
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
      data[index + 3] = light * 0.62 * 255;
    }
  }
}
