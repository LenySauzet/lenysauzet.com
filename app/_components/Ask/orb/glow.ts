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

const LAVENDER: Color = [0.64, 0.6, 0.8];
const SILVER: Color = [0.88, 0.9, 0.93];

const RIM = { depth: 0.38, above: 3, below: 5, strength: 0.42 };
const HALO = { lean: 0.45, wide: 0.7, tall: 1.05, strength: 0.38 };
const OPACITY = 0.7;

const bell = (value: number) => Math.exp(-0.5 * value * value);

export function rimAt(x: number, y: number, avatar: Avatar) {
  const offset = (y - avatar.y) / avatar.size;
  const along = bell(offset / (offset < 0 ? RIM.above : RIM.below));
  return RIM.strength * along * Math.exp(-Math.max(x, 0) / (avatar.size * RIM.depth));
}

export function haloAt(x: number, y: number, avatar: Avatar) {
  const dx = (x - (avatar.x - HALO.lean * avatar.size)) / (avatar.size * HALO.wide);
  const dy = (y - avatar.y) / (avatar.size * HALO.tall);
  return HALO.strength * bell(Math.hypot(dx, dy));
}

export function glowAt(x: number, y: number, avatar: Avatar) {
  const rim = rimAt(x, y, avatar);
  const halo = haloAt(x, y, avatar);
  const light = rim + halo;
  const color = LAVENDER.map((channel, index) =>
    light > 0 ? (channel * rim + SILVER[index]! * halo) / light : channel
  ) as unknown as Color;
  return { light, color };
}

export function guidePath(avatar: Avatar, box: Box) {
  const cx = avatar.x - HALO.lean * avatar.size;
  const rx = (avatar.size * HALO.wide * 2).toFixed(1);
  const ry = (avatar.size * HALO.tall * 2).toFixed(1);
  const depth = (avatar.size * RIM.depth).toFixed(1);
  return `M${(cx - Number(rx)).toFixed(1)},${avatar.y}a${rx},${ry} 0 1 0 ${(2 * Number(rx)).toFixed(1)},0a${rx},${ry} 0 1 0 ${(-2 * Number(rx)).toFixed(1)},0M${depth},0L${depth},${box.height}`;
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
      data[index + 3] = light * OPACITY * 255;
    }
  }
}
