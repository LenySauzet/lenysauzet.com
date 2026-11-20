import type { Vector } from './motion';
import type { Detail, Sample, Span, Target } from './protocol';

const ANCHOR_ATTRIBUTE = 'data-presence';
const PAGE_ANCHOR = 'page';
const LONGEST_ANCHOR = 64;
const DEEPEST = 16;
const CHARACTER = '#';
const SLACK = 2;

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

const documentBox = ({ left, top, width, height }: DOMRect | Box): Box => ({
  left: left + window.scrollX,
  top: top + window.scrollY,
  width,
  height,
});

const shownAnchor = (anchor: string) =>
  [...document.querySelectorAll(`[${ANCHOR_ATTRIBUTE}="${anchor}"]`)].find(isShown);

const shownAnchors = (): Anchored[] =>
  [...document.querySelectorAll(`[${ANCHOR_ATTRIBUTE}]`)].filter(isShown).flatMap((element) => {
    const anchor = element.getAttribute(ANCHOR_ATTRIBUTE);
    return anchor ? [{ anchor, box: documentBox(element.getBoundingClientRect()) }] : [];
  });

const anchorOf = (node: Node) =>
  (node instanceof Element ? node : node.parentElement)?.closest(`[${ANCHOR_ATTRIBUTE}]`) ?? undefined;

const offsetWithin = (anchor: Node, node: Node, offset: number) => {
  const before = document.createRange();
  before.selectNodeContents(anchor);
  before.setEnd(node, offset);
  return before.toString().length;
};

function rangeWithin(root: Element, start: number, end: number): Range | undefined {
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

const characterBox = (root: Element, index: number) => {
  const rect = rangeWithin(root, index, index + 1)?.getClientRects()[0];
  return rect && rect.width > 0 ? rect : undefined;
};

const pathTo = (root: Element, element: Element) => {
  const steps: number[] = [];
  for (let node: Element | null = element; node && node !== root; node = node.parentElement) {
    const parent: Element | null = node.parentElement;
    if (!parent) return '';
    steps.unshift([...parent.children].indexOf(node));
  }
  return steps.slice(0, DEEPEST).join('.');
};

const elementAt = (root: Element, path: string) => {
  let element: Element | undefined = root;
  for (const step of path ? path.split('.') : []) element = element?.children[Number(step)];
  return element;
};

const caretAt = (x: number, y: number): { node: Node; offset: number } | undefined => {
  if (typeof document.caretPositionFromPoint === 'function') {
    const position = document.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : undefined;
  }
  const range = typeof document.caretRangeFromPoint === 'function' ? document.caretRangeFromPoint(x, y) : null;
  return range ? { node: range.startContainer, offset: range.startOffset } : undefined;
};

const holds = (rect: DOMRect, { x, y }: Vector) =>
  x >= rect.left - SLACK && x <= rect.right + SLACK && y >= rect.top - SLACK && y <= rect.bottom + SLACK;

function characterUnder(root: Element, client: Vector) {
  const caret = caretAt(client.x, client.y);
  if (!caret || caret.node.nodeType !== Node.TEXT_NODE || !root.contains(caret.node)) return undefined;
  const index = offsetWithin(root, caret.node, caret.offset);
  return [index, index - 1].find((candidate) => {
    if (candidate < 0) return false;
    const rect = characterBox(root, candidate);
    return rect !== undefined && holds(rect, client);
  });
}

export function aim(client: Vector): Target | undefined {
  const element = document.elementFromPoint(client.x, client.y);
  const root = element?.closest(`[${ANCHOR_ATTRIBUTE}]`);
  const anchor = root?.getAttribute(ANCHOR_ATTRIBUTE);
  if (!element || !root || !anchor) return undefined;
  const character = characterUnder(root, client);
  return { anchor, part: character === undefined ? pathTo(root, element) : `${CHARACTER}${character}` };
}

function boxOf({ anchor, part }: Target): Box | undefined {
  if (anchor === PAGE_ANCHOR) return pageBox();
  const root = shownAnchor(anchor);
  if (!root) return undefined;
  if (part.startsWith(CHARACTER)) {
    const rect = characterBox(root, Number(part.slice(CHARACTER.length)));
    return documentBox(rect ?? root.getBoundingClientRect());
  }
  const element = elementAt(root, part);
  return documentBox((element && isShown(element) ? element : root).getBoundingClientRect());
}

export function locate(
  points: Vector[],
  held?: string
): { anchor: string; placements: Placement[]; detail?: Detail } | undefined {
  const last = points.at(-1);
  if (!last) return undefined;
  const aimed = aim({ x: last.x - window.scrollX, y: last.y - window.scrollY });
  const anchor =
    aimed?.anchor ??
    (held && boxOf({ anchor: held, part: '' }) ? held : undefined) ??
    nearest(shownAnchors(), last)?.anchor ??
    PAGE_ANCHOR;
  const box = boxOf({ anchor, part: '' }) ?? pageBox();
  const placements = points.map((point) => placeOn(box, point));
  const partBox = aimed?.part ? boxOf(aimed) : undefined;
  if (!aimed?.part || !partBox) return { anchor, placements };
  const { x, y } = placeOn(partBox, last);
  return { anchor, placements, detail: { part: aimed.part, x, y } };
}

export function createPlacer() {
  const boxes = new Map<string, Box | undefined>();
  const page = pageBox();

  return (target: Target, placement: Placement): Vector | undefined => {
    const key = `${target.anchor} ${target.part}`;
    if (!boxes.has(key)) boxes.set(key, boxOf(target));
    const box = boxes.get(key);
    if (!box) return undefined;
    const point = pointOn(box, placement);
    return { x: clamp(point.x, 0, page.width), y: clamp(point.y, 0, page.height) };
  };
}

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
  return root && rangeWithin(root, start, end);
}
