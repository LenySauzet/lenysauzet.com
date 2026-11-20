import type { Vector } from './motion';
import type { Point, Span } from './protocol';

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
  (name ? `${kind}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` : kind).slice(
    0,
    LONGEST_ANCHOR
  );

export const toFraction = (box: Box, point: Vector): Vector => ({
  x: box.width ? (point.x - box.left) / box.width : 0,
  y: box.height ? (point.y - box.top) / box.height : 0,
});

export const fromFraction = (box: Box, fraction: Vector): Vector => ({
  x: box.left + fraction.x * box.width,
  y: box.top + fraction.y * box.height,
});

const clampReach = (value: number) => Math.min(1 + REACH, Math.max(-REACH, value));

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
  [...document.querySelectorAll(`[${ANCHOR_ATTRIBUTE}="${anchor}"]`)].find(
    (candidate) => candidate.getClientRects().length > 0
  );

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
      const element = anchor === PAGE_ANCHOR ? undefined : shownAnchor(anchor);
      boxes.set(anchor, anchor === PAGE_ANCHOR ? pageBox() : element && documentBox(element));
    }
    return boxes.get(anchor);
  };

  return (point: Point): Vector | undefined => {
    const box = boxOf(point.anchor);
    return box && fromFraction(box, point);
  };
}

const offsetWithin = (anchor: Node, node: Node, offset: number) => {
  const before = document.createRange();
  before.selectNodeContents(anchor);
  before.setEnd(node, offset);
  return before.toString().length;
};

export function spanOf(range: Range): Span | undefined {
  const container =
    range.commonAncestorContainer instanceof Element
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
  const anchor = container?.closest(`[${ANCHOR_ATTRIBUTE}]`);
  const name = anchor?.getAttribute(ANCHOR_ATTRIBUTE);
  if (!anchor || !name) return undefined;

  const start = offsetWithin(anchor, range.startContainer, range.startOffset);
  const end = offsetWithin(anchor, range.endContainer, range.endOffset);
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
    if (!placedStart && start <= passed + length) {
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
