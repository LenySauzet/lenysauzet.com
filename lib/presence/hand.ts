export interface HandShape {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  turn?: number;
}

export const HAND_VIEW = 26;
export const HAND_STROKE = 0.4;
export const HAND_RIM_STROKE = 4.2;

export const HAND_SHAPES: HandShape[] = [
  { x: 6.5, y: 11.6, width: 13.2, height: 10.4, radius: 4 },
  { x: 6.6, y: 5.4, width: 2.2, height: 9.5, radius: 1.1 },
  { x: 10.2, y: 3.4, width: 2.2, height: 11, radius: 1.1 },
  { x: 13.8, y: 4, width: 2.2, height: 10.5, radius: 1.1 },
  { x: 17.4, y: 6.2, width: 2.1, height: 8.2, radius: 1.05 },
  { x: 5.8, y: 11, width: 2.3, height: 7.6, radius: 1.15, turn: -35 },
];

const turnOf = ({ x, y, width, height, turn }: HandShape) =>
  turn ? `rotate(${turn} ${x + width / 2} ${y + height})` : undefined;

export const handShapeProps = (shape: HandShape) => ({
  x: shape.x,
  y: shape.y,
  width: shape.width,
  height: shape.height,
  rx: shape.radius,
  transform: turnOf(shape),
});

const svgOf = (fill: string, rim: string, size: number) => {
  const rects = (color: string, width: number) =>
    HAND_SHAPES.map((shape) => {
      const { x, y, width: w, height, rx, transform } = handShapeProps(shape);
      const turned = transform ? ` transform="${transform}"` : '';
      return `<rect x="${x}" y="${y}" width="${w}" height="${height}" rx="${rx}"${turned} fill="${color}" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>`;
    }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${HAND_VIEW} ${HAND_VIEW}">${rects(rim, HAND_RIM_STROKE)}${rects(fill, HAND_STROKE)}</svg>`;
};

const OWN_SIZE = 28;

export const OWN_HAND_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(svgOf('#161616', '#ffffff', OWN_SIZE))}") ${OWN_SIZE / 2} ${OWN_SIZE / 2}, grab`;
