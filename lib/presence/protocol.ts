export interface Point {
  anchor: string;
  x: number;
  y: number;
}

export interface Span {
  anchor: string;
  start: number;
  end: number;
}

export type ClientMessage =
  | { type: 'move'; point: Point }
  | { type: 'press' }
  | { type: 'release' }
  | { type: 'leave' }
  | { type: 'highlight'; span: Span }
  | { type: 'unhighlight' };

export interface Cursor {
  id: string;
  point: Point;
}

export interface Highlight {
  id: string;
  span: Span;
}

export type ServerMessage =
  | { type: 'snapshot'; cursors: Cursor[]; highlights: Highlight[] }
  | { type: 'move'; id: string; point: Point }
  | { type: 'press'; id: string }
  | { type: 'release'; id: string }
  | { type: 'leave'; id: string }
  | { type: 'gone'; id: string }
  | { type: 'highlight'; id: string; span: Span }
  | { type: 'unhighlight'; id: string };

export const HEARTBEAT = 'ping';
export const HEARTBEAT_REPLY = 'pong';
export const MAX_CLIENT_MESSAGE = 128;
export const EVICTED = 4000;

const ANCHOR = /^[a-z0-9][a-z0-9:-]{0,63}$/;
const ID = /^[a-z0-9]{1,16}$/;
const REACH = 0.5;
const PRECISION = 1e4;
const LONGEST_TEXT = 20_000;

const SIGNALS = { p: 'press', r: 'release', l: 'leave', u: 'unhighlight' } as const;
const TAGS = { press: 'p', release: 'r', leave: 'l', unhighlight: 'u', gone: 'g' } as const;

const round = (value: number) => Math.round(value * PRECISION) / PRECISION;
const isCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= -REACH && value <= 1 + REACH;
const isOffset = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= LONGEST_TEXT;
const isAnchor = (value: unknown): value is string => typeof value === 'string' && ANCHOR.test(value);
const isId = (value: unknown): value is string => typeof value === 'string' && ID.test(value);

const pointFrom = ([anchor, x, y, ...rest]: unknown[]): Point | undefined =>
  rest.length === 0 && isAnchor(anchor) && isCoordinate(x) && isCoordinate(y) ? { anchor, x, y } : undefined;

const spanFrom = ([anchor, start, end, ...rest]: unknown[]): Span | undefined =>
  rest.length === 0 && isAnchor(anchor) && isOffset(start) && isOffset(end) && end > start
    ? { anchor, start, end }
    : undefined;

const pointTo = ({ anchor, x, y }: Point) => [anchor, round(x), round(y)];
const spanTo = ({ anchor, start, end }: Span) => [anchor, start, end];

const parse = (data: string): unknown[] | undefined => {
  try {
    const value: unknown = JSON.parse(data);
    return Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const isSignal = (tag: unknown): tag is keyof typeof SIGNALS => typeof tag === 'string' && tag in SIGNALS;

export function encodeClient(message: ClientMessage) {
  switch (message.type) {
    case 'move':
      return JSON.stringify(['m', ...pointTo(message.point)]);
    case 'highlight':
      return JSON.stringify(['h', ...spanTo(message.span)]);
    default:
      return JSON.stringify([TAGS[message.type]]);
  }
}

export function decodeClient(data: string): ClientMessage | undefined {
  const [tag, ...rest] = parse(data) ?? [];
  if (tag === 'm') {
    const point = pointFrom(rest);
    return point && { type: 'move', point };
  }
  if (tag === 'h') {
    const span = spanFrom(rest);
    return span && { type: 'highlight', span };
  }
  return isSignal(tag) && rest.length === 0 ? { type: SIGNALS[tag] } : undefined;
}

export function encodeServer(message: ServerMessage) {
  switch (message.type) {
    case 'snapshot':
      return JSON.stringify([
        's',
        message.cursors.map(({ id, point }) => [id, ...pointTo(point)]),
        message.highlights.map(({ id, span }) => [id, ...spanTo(span)]),
      ]);
    case 'move':
      return JSON.stringify(['m', message.id, ...pointTo(message.point)]);
    case 'highlight':
      return JSON.stringify(['h', message.id, ...spanTo(message.span)]);
    default:
      return JSON.stringify([TAGS[message.type], message.id]);
  }
}

function listFrom<T>(value: unknown, read: (fields: unknown[]) => T | undefined) {
  if (!Array.isArray(value)) return undefined;
  const list: { id: string; value: T }[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry)) return undefined;
    const [id, ...fields] = entry;
    const parsed = read(fields);
    if (!isId(id) || !parsed) return undefined;
    list.push({ id, value: parsed });
  }
  return list;
}

export function decodeServer(data: string): ServerMessage | undefined {
  const [tag, id, ...rest] = parse(data) ?? [];
  if (tag === 's') {
    const [highlights, ...extra] = rest;
    const cursors = listFrom(id, pointFrom);
    const spans = listFrom(highlights, spanFrom);
    if (!cursors || !spans || extra.length) return undefined;
    return {
      type: 'snapshot',
      cursors: cursors.map(({ id: owner, value }) => ({ id: owner, point: value })),
      highlights: spans.map(({ id: owner, value }) => ({ id: owner, span: value })),
    };
  }
  if (!isId(id)) return undefined;
  if (tag === 'm') {
    const point = pointFrom(rest);
    return point && { type: 'move', id, point };
  }
  if (tag === 'h') {
    const span = spanFrom(rest);
    return span && { type: 'highlight', id, span };
  }
  if (rest.length) return undefined;
  if (tag === 'g') return { type: 'gone', id };
  return isSignal(tag) ? { type: SIGNALS[tag], id } : undefined;
}
