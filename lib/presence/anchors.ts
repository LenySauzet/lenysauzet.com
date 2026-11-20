import type { Vector } from './motion';
import type { Sample, Span } from './protocol';

const ANCHOR_ATTRIBUTE = 'data-presence';
const PAGE_ANCHOR = 'page';
const LONGEST_ANCHOR = 64;

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type Placement = Omit<Sample, 'age'>;

interface Anchored {
  anchor: string;
  box: Box;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const anchorFor = (kind: string, name?: string) =>
  (name ? `${kind}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` : kind).slice(
    0,
    LONGEST_ANCHOR
  );

const closestOn = (box: Box, point: Vector): Vector => ({
  x: clamp(point.x, box.left, box.left + box.width),
  y: clamp(point.y, box.top, box.top + box.height),
});

const distanceTo = (box: Box, point: Vector) => {
  const closest = closestOn(box, point);
  return Math.hypot(point.x - closest.x, point.y - closest.y);
};

export const placeOn = (box: Box, point: Vector): Placement => {
  const closest = closestOn(box, point);
  return {
    x: box.width ? (closest.x - box.left) / box.width : 0,
    y: box.height ? (closest.y - box.top) / box.height : 0,
    dx: Math.round(point.x - closest.x),
    dy: Math.round(point.y - closest.y),
  };
};

export const pointOn = (box: Box, { x, y, dx, dy }: Placement): Vector => ({
  x: box.left + x * box.width + dx,
  y: box.top + y * box.height + dy,
});

const area = ({ width, height }: Box) => width * height;

export function nearest<T extends Anchored>(candidates: T[], point: Vector): T | undefined {
  let best: { candidate: T; distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = distanceTo(candidate.box, point);
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && area(candidate.box) < area(best.candidate.box))
    )
      best = { candidate, distance };
  }
  return best?.candidate;
}

const isShown = (element: Element) => element.getClientRects().length > 0;

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

const shownAnchor = (anchor: string) =>
  [...document.querySelectorAll(`[${ANCHOR_ATTRIBUTE}="${anchor}"]`)].find(isShown);

const shownAnchors = (): Anchored[] =>
  [...document.querySelectorAll(`[${ANCHOR_ATTRIBUTE}]`)].filter(isShown).flatMap((element) => {
    const anchor = element.getAttribute(ANCHOR_ATTRIBUTE);
    return anchor ? [{ anchor, box: documentBox(element) }] : [];
  });

export function locate(points: Vector[]): { anchor: string; placements: Placement[] } | undefined {
  const last = points.at(-1);
  if (!last) return undefined;
  const { anchor, box } = nearest(shownAnchors(), last) ?? { anchor: PAGE_ANCHOR, box: pageBox() };
  return { anchor, placements: points.map((point) => placeOn(box, point)) };
}

export function createPlacer() {
  const boxes = new Map<string, Box | undefined>();
  const page = pageBox();

  const boxOf = (anchor: string) => {
    if (!boxes.has(anchor)) {
      const element = anchor === PAGE_ANCHOR ? undefined : shownAnchor(anchor);
      boxes.set(anchor, anchor === PAGE_ANCHOR ? page : element && documentBox(element));
    }
    return boxes.get(anchor);
  };

  return (anchor: string, placement: Placement): Vector | undefined => {
    const box = boxOf(anchor);
    if (!box) return undefined;
    const point = pointOn(box, placement);
    return { x: clamp(point.x, 0, page.width), y: clamp(point.y, 0, page.height) };
  };
}

const anchorOf = (node: Node) =>
  (node instanceof Element ? node : node.parentElement)?.closest(`[${ANCHOR_ATTRIBUTE}]`) ?? undefined;

const offsetWithin = (anchor: Node, node: Node, offset: number) => {
  const before = document.createRange();
  before.selectNodeContents(anchor);
  before.setEnd(node, offset);
  return before.toString().length;
};

export function spanOf(range: Range): Span | undefined {
  const anchor = anchorOf(range.startContainer) ?? anchorOf(range.endContainer);
  const name = anchor?.getAttribute(ANCHOR_ATTRIBUTE);
  if (!anchor || !name) return undefined;

  const start = anchor.contains(range.startContainer) ? offsetWithin(anchor, range.startContainer, range.startOffset) : 0;
  const end = anchor.contains(range.endContainer)
    ? offsetWithin(anchor, range.endContainer, range.endOffset)
    : (anchor.textContent?.length ?? 0);
  return end > start ? { anchor: name, start, end } : undefined;
}

export function rangeOf({ anchor, start, end }: Span): Range | undefined {
  const root = shownAnchor(anchor);
  if (!root) return undefined;

  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let passed = 0;
  let placedStart = false;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (!placedStart && start < passed + length) {
      range.setStart(node, start - passed);
      placedStart = true;
    }
    if (placedStart && end <= passed + length) {
      range.setEnd(node, end - passed);
      return range;
    }
    passed += length;
  }

  return undefined;
}
