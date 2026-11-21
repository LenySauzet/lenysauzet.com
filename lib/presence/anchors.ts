import { clamp } from '@/lib/utils';

import { distanceTo, nearest, placeOn, pointOn, type Anchored, type Box, type Placement } from './geometry';
import type { Vector } from './motion';
import { MOST_SPANS, type Detail, type Span } from './protocol';

export interface Target {
  anchor: string;
  part: string;
}

const ANCHOR_ATTRIBUTE = 'data-presence';
const VOLATILE = '[data-presence-volatile]';
const PAGE_ANCHOR = 'page';
const DEEPEST = 16;
const CHARACTER = '#';
const SLACK = 2;
const HOLD_REACH = 600;

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

const textNodes = (root: Node) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.parentElement?.closest(VOLATILE) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node instanceof Text) nodes.push(node);
  return nodes;
};

const textLength = (root: Node) => textNodes(root).reduce((length, node) => length + node.length, 0);

const offsetWithin = (anchor: Node, node: Node, offset: number) => {
  const before = document.createRange();
  before.selectNodeContents(anchor);
  before.setEnd(node, offset);
  let length = 0;
  for (const text of textNodes(anchor)) {
    if (text === node) return length + offset;
    if (!before.intersectsNode(text)) break;
    length += text.length;
  }
  return length;
};

function rangeWithin(root: Element, start: number, end: number): Range | undefined {
  const range = document.createRange();
  let passed = 0;
  let placedStart = false;

  for (const node of textNodes(root)) {
    if (!placedStart && start < passed + node.length) {
      range.setStart(node, start - passed);
      placedStart = true;
    }
    if (placedStart && end <= passed + node.length) {
      range.setEnd(node, end - passed);
      return range;
    }
    passed += node.length;
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

function aim(client: Vector): Target | undefined {
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
  const heldBox = held ? boxOf({ anchor: held, part: '' }) : undefined;
  const anchor =
    aimed?.anchor ??
    (held && heldBox && distanceTo(heldBox, last) <= HOLD_REACH ? held : undefined) ??
    nearest(shownAnchors(), last)?.anchor ??
    PAGE_ANCHOR;
  const box = boxOf({ anchor, part: '' }) ?? pageBox();
  const placements = points.map((point) => placeOn(box, point));
  const partBox = aimed?.part ? boxOf(aimed) : undefined;
  if (!aimed?.part || !partBox) return { anchor, placements };
  const { x, y } = placeOn(partBox, last);
  const width = Math.round(partBox.width);
  const height = Math.round(partBox.height);
  return { anchor, placements, detail: { part: aimed.part, x, y, width, height } };
}

export function createPlacer() {
  const boxes = new Map<string, Box | undefined>();
  const page = pageBox();

  const box = (target: Target) => {
    const key = `${target.anchor} ${target.part}`;
    if (!boxes.has(key)) boxes.set(key, boxOf(target));
    return boxes.get(key);
  };

  const place = (target: Target, placement: Placement): Vector | undefined => {
    const found = box(target);
    if (!found) return undefined;
    const point = pointOn(found, placement);
    return { x: clamp(point.x, 0, page.width), y: clamp(point.y, 0, page.height) };
  };

  return { place, box };
}

export function spansOf(range: Range): Span[] {
  return [...document.querySelectorAll(`[${ANCHOR_ATTRIBUTE}]`)]
    .filter((anchor) => isShown(anchor) && range.intersectsNode(anchor))
    .flatMap((anchor) => {
      const name = anchor.getAttribute(ANCHOR_ATTRIBUTE);
      const start = anchor.contains(range.startContainer)
        ? offsetWithin(anchor, range.startContainer, range.startOffset)
        : 0;
      const end = anchor.contains(range.endContainer)
        ? offsetWithin(anchor, range.endContainer, range.endOffset)
        : textLength(anchor);
      return name && end > start ? [{ anchor: name, start, end }] : [];
    })
    .slice(0, MOST_SPANS);
}

export function rangeOf({ anchor, start, end }: Span): Range | undefined {
  const root = shownAnchor(anchor);
  return root && rangeWithin(root, start, end);
}

export function createRangeReader() {
  const roots = new Map<string, Element | undefined>();
  return ({ anchor, start, end }: Span): Range | undefined => {
    if (!roots.has(anchor)) roots.set(anchor, shownAnchor(anchor));
    const root = roots.get(anchor);
    return root && rangeWithin(root, start, end);
  };
}
