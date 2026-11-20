export interface Sample {
  age: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface Target {
  anchor: string;
  part: string;
}

export interface Detail {
  part: string;
  x: number;
  y: number;
}

export interface Path {
  anchor: string;
  detail?: Detail;
  samples: Sample[];
}

export interface Span {
  anchor: string;
  start: number;
  end: number;
}

export type Corner = 0 | 1 | 2 | 3;

export interface Pull {
  frame: string;
  corner: Corner;
  x: number;
  y: number;
}

export type ClientMessage =
  | { type: 'move'; path: Path }
  | { type: 'press' }
  | { type: 'release' }
  | { type: 'leave' }
  | { type: 'highlight'; span: Span }
  | { type: 'unhighlight' }
  | { type: 'pull'; pull: Pull }
  | { type: 'drop'; frame: string };

export interface Cursor {
  id: string;
  path: Path;
}

export interface Highlight {
  id: string;
  span: Span;
}

export type ServerMessage =
  | { type: 'snapshot'; cursors: Cursor[]; highlights: Highlight[] }
  | { type: 'move'; id: string; path: Path }
  | { type: 'press'; id: string }
  | { type: 'release'; id: string }
  | { type: 'leave'; id: string }
  | { type: 'gone'; id: string }
  | { type: 'highlight'; id: string; span: Span }
  | { type: 'unhighlight'; id: string }
  | { type: 'pull'; id: string; pull: Pull }
  | { type: 'drop'; id: string; frame: string };

export const HEARTBEAT = 'ping';
export const HEARTBEAT_REPLY = 'pong';
export const MAX_CLIENT_MESSAGE = 320;
export const MOST_SAMPLES = 4;
export const LONGEST_PULL = 64;
export const EVICTED = 4000;

const NAME = /^[a-z0-9][a-z0-9:-]{0,63}$/;
const ID = /^[a-z0-9]{1,16}$/;
const PART = /^(?:\d{1,3}(?:\.\d{1,3}){0,15}|#\d{1,5})$/;
const PRECISION = 1e4;
const LONGEST_TEXT = 20_000;
const FARTHEST = 4000;
const OLDEST = 1000;

const SIGNALS = { p: 'press', r: 'release', l: 'leave', u: 'unhighlight' } as const;
const TAGS = { press: 'p', release: 'r', leave: 'l', unhighlight: 'u', gone: 'g' } as const;

const round = (value: number, precision = PRECISION) => Math.round(value * precision) / precision;
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isWhole = (value: unknown, limit: number): value is number =>
  isNumber(value) && Number.isInteger(value) && Math.abs(value) <= limit;
const isCount = (value: unknown, limit: number): value is number => isWhole(value, limit) && value >= 0;
const isFraction = (value: unknown): value is number => isNumber(value) && value >= 0 && value <= 1;
const isName = (value: unknown): value is string => typeof value === 'string' && NAME.test(value);
const isId = (value: unknown): value is string => typeof value === 'string' && ID.test(value);
const isPart = (value: unknown): value is string => typeof value === 'string' && PART.test(value);
const isCorner = (value: unknown): value is Corner => isCount(value, 3);
const isStretch = (value: unknown): value is number => isNumber(value) && Math.abs(value) <= LONGEST_PULL;

const sampleFrom = (value: unknown): Sample | undefined => {
  if (!Array.isArray(value)) return undefined;
  const [age, x, y, dx, dy, ...rest] = value;
  return rest.length === 0 &&
    isCount(age, OLDEST) &&
    isFraction(x) &&
    isFraction(y) &&
    isWhole(dx, FARTHEST) &&
    isWhole(dy, FARTHEST)
    ? { age, x, y, dx, dy }
    : undefined;
};

const detailFrom = (value: unknown): Detail | null | undefined => {
  if (value === null) return null;
  if (!Array.isArray(value)) return undefined;
  const [part, x, y, ...rest] = value;
  return rest.length === 0 && isPart(part) && isFraction(x) && isFraction(y) ? { part, x, y } : undefined;
};

const pathFrom = ([anchor, rawDetail, ...fields]: unknown[]): Path | undefined => {
  const detail = detailFrom(rawDetail);
  if (!isName(anchor) || detail === undefined || fields.length === 0 || fields.length > MOST_SAMPLES) return undefined;
  const samples: Sample[] = [];
  for (const field of fields) {
    const sample = sampleFrom(field);
    const previous = samples.at(-1);
    if (!sample || (previous && sample.age > previous.age)) return undefined;
    samples.push(sample);
  }
  return detail ? { anchor, detail, samples } : { anchor, samples };
};

const spanFrom = ([anchor, start, end, ...rest]: unknown[]): Span | undefined =>
  rest.length === 0 && isName(anchor) && isCount(start, LONGEST_TEXT) && isCount(end, LONGEST_TEXT) && end > start
    ? { anchor, start, end }
    : undefined;

const pullFrom = ([frame, corner, x, y, ...rest]: unknown[]): Pull | undefined =>
  rest.length === 0 && isName(frame) && isCorner(corner) && isStretch(x) && isStretch(y)
    ? { frame, corner, x, y }
    : undefined;

const dropFrom = ([frame, ...rest]: unknown[]) => (rest.length === 0 && isName(frame) ? frame : undefined);

const sampleTo = ({ age, x, y, dx, dy }: Sample) => [Math.round(age), round(x), round(y), Math.round(dx), Math.round(dy)];
const pathTo = ({ anchor, detail, samples }: Path) => [
  anchor,
  detail ? [detail.part, round(detail.x), round(detail.y)] : null,
  ...samples.map(sampleTo),
];
const spanTo = ({ anchor, start, end }: Span) => [anchor, start, end];
const pullTo = ({ frame, corner, x, y }: Pull) => [frame, corner, round(x, 10), round(y, 10)];

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
      return JSON.stringify(['m', ...pathTo(message.path)]);
    case 'highlight':
      return JSON.stringify(['h', ...spanTo(message.span)]);
    case 'pull':
      return JSON.stringify(['d', ...pullTo(message.pull)]);
    case 'drop':
      return JSON.stringify(['e', message.frame]);
    default:
      return JSON.stringify([TAGS[message.type]]);
  }
}

export function decodeClient(data: string): ClientMessage | undefined {
  const [tag, ...rest] = parse(data) ?? [];
  switch (tag) {
    case 'm': {
      const path = pathFrom(rest);
      return path && { type: 'move', path };
    }
    case 'h': {
      const span = spanFrom(rest);
      return span && { type: 'highlight', span };
    }
    case 'd': {
      const pull = pullFrom(rest);
      return pull && { type: 'pull', pull };
    }
    case 'e': {
      const frame = dropFrom(rest);
      return frame === undefined ? undefined : { type: 'drop', frame };
    }
    default:
      return isSignal(tag) && rest.length === 0 ? { type: SIGNALS[tag] } : undefined;
  }
}

export function encodeServer(message: ServerMessage) {
  switch (message.type) {
    case 'snapshot':
      return JSON.stringify([
        's',
        message.cursors.map(({ id, path }) => [id, ...pathTo(path)]),
        message.highlights.map(({ id, span }) => [id, ...spanTo(span)]),
      ]);
    case 'move':
      return JSON.stringify(['m', message.id, ...pathTo(message.path)]);
    case 'highlight':
      return JSON.stringify(['h', message.id, ...spanTo(message.span)]);
    case 'pull':
      return JSON.stringify(['d', message.id, ...pullTo(message.pull)]);
    case 'drop':
      return JSON.stringify(['e', message.id, message.frame]);
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
    const cursors = listFrom(id, pathFrom);
    const spans = listFrom(highlights, spanFrom);
    if (!cursors || !spans || extra.length) return undefined;
    return {
      type: 'snapshot',
      cursors: cursors.map(({ id: owner, value }) => ({ id: owner, path: value })),
      highlights: spans.map(({ id: owner, value }) => ({ id: owner, span: value })),
    };
  }
  if (!isId(id)) return undefined;
  switch (tag) {
    case 'm': {
      const path = pathFrom(rest);
      return path && { type: 'move', id, path };
    }
    case 'h': {
      const span = spanFrom(rest);
      return span && { type: 'highlight', id, span };
    }
    case 'd': {
      const pull = pullFrom(rest);
      return pull && { type: 'pull', id, pull };
    }
    case 'e': {
      const frame = dropFrom(rest);
      return frame === undefined ? undefined : { type: 'drop', id, frame };
    }
    case 'g':
      return rest.length ? undefined : { type: 'gone', id };
    default:
      return isSignal(tag) && rest.length === 0 ? { type: SIGNALS[tag], id } : undefined;
  }
}
