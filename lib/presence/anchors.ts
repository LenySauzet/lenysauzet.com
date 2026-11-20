import type { Point } from './protocol';
import type { Vector } from './motion';

const ANCHOR_ATTRIBUTE = 'data-presence';
const PAGE_ANCHOR = 'page';
const LONGEST_ANCHOR = 64;
const REACH = 0.5;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const anchorFor = (kind: string, name?: string) =>
  (name ? `${kind}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` : kind).slice(0, LONGEST_ANCHOR);

const clampReach = (value: number) => Math.min(1 + REACH, Math.max(-REACH, value));

export const toFraction = (box: Box, point: Vector): Vector => ({
  x: box.width ? (point.x - box.left) / box.width : 0,
  y: box.height ? (point.y - box.top) / box.height : 0,
});

export const fromFraction = (box: Box, fraction: Vector): Vector => ({
  x: box.left + fraction.x * box.width,
  y: box.top + fraction.y * box.height,
});

const pageBox = (): Box => ({
  left: 0,
  top: 0,
  width: document.documentElement.clientWidth,
  height: document.documentElement.scrollHeight,
});

const documentBox = (element: Element): Box => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left: left + window.scrollX, top: top + window.scrollY, width, height };
};

export function locate(client: Vector): Point {
  const anchor = document.elementFromPoint(client.x, client.y)?.closest(`[${ANCHOR_ATTRIBUTE}]`);
  const page = { x: client.x + window.scrollX, y: client.y + window.scrollY };

  const fraction = toFraction(anchor ? documentBox(anchor) : pageBox(), page);

  return {
    anchor: anchor?.getAttribute(ANCHOR_ATTRIBUTE) ?? PAGE_ANCHOR,
    x: clampReach(fraction.x),
    y: clampReach(fraction.y),
  };
}

export function createPlacer() {
  const boxes = new Map<string, Box | undefined>();

  const boxOf = (anchor: string) => {
    if (!boxes.has(anchor)) {
      const element = [...document.querySelectorAll(`[${ANCHOR_ATTRIBUTE}="${anchor}"]`)].find(
        (candidate) => candidate.getClientRects().length > 0
      );
      boxes.set(anchor, anchor === PAGE_ANCHOR ? pageBox() : element && documentBox(element));
    }
    return boxes.get(anchor);
  };

  return (point: Point): Vector | undefined => {
    const box = boxOf(point.anchor);
    return box && fromFraction(box, point);
  };
}
