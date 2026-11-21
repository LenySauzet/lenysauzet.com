export type Layout = 1 | 2 | 3;

export interface Sample {
  age: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface Detail {
  part: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Path {
  anchor: string;
  layout: Layout;
  detail?: Detail;
  samples: Sample[];
}

export interface Span {
  anchor: string;
  start: number;
  end: number;
}

export interface Marks {
  layout: Layout;
  spans: Span[];
  backward?: true;
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
  | { type: 'click' }
  | { type: 'release' }
  | { type: 'leave' }
  | { type: 'highlight'; marks: Marks }
  | { type: 'unhighlight' }
  | { type: 'pull'; pull: Pull }
  | { type: 'drop'; frame: string };

export interface Cursor {
  id: string;
  path: Path;
}

export interface Highlight {
  id: string;
  marks: Marks;
}

export type ServerMessage =
  | { type: 'snapshot'; cursors: Cursor[]; highlights: Highlight[] }
  | { type: 'move'; id: string; path: Path }
  | { type: 'press'; id: string }
  | { type: 'click'; id: string }
  | { type: 'release'; id: string }
  | { type: 'leave'; id: string }
  | { type: 'gone'; id: string }
  | { type: 'highlight'; id: string; marks: Marks }
  | { type: 'unhighlight'; id: string }
  | { type: 'pull'; id: string; pull: Pull }
  | { type: 'drop'; id: string; frame: string };

export const HEARTBEAT = 'ping';
export const HEARTBEAT_REPLY = 'pong';
export const MAX_CLIENT_MESSAGE = 768;
export const MOST_SPANS = 8;
export const MOST_SAMPLES = 4;
const LONGEST_PULL = 64;
export const EVICTED = 4000;
export const FLOODING = 4001;

const NAME = /^[a-z0-9][a-z0-9:-]{0,63}$/;
const ID = /^[a-z0-9]{1,16}$/;
const PART = /^(?:\d{1,3}(?:\.\d{1,3}){0,15}|#\d{1,5})$/;
const PRECISION = 1e4;
const LONGEST_TEXT = 20_000;
const FARTHEST = 4000;
const OLDEST = 1000;

const TAGS = {
  snapshot: 's',
  move: 'm',
  press: 'p',
  click: 'c',
  release: 'r',
  leave: 'l',
  gone: 'g',
  highlight: 'h',
  unhighlight: 'u',
  pull: 'd',
  drop: 'e',
} as const;

type Type = keyof typeof TAGS;
type Body = ClientMessage | Exclude<ServerMessage, { type: 'snapshot' | 'gone' }>;

const TYPES = new Map<unknown, Type>(Object.entries(TAGS).map(([type, tag]) => [tag, type as Type]));

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
  const [part, x, y, width, height, ...rest] = value;
  return rest.length === 0 &&
    isPart(part) &&
    isFraction(x) &&
    isFraction(y) &&
    isCount(width, FARTHEST) &&
    isCount(height, FARTHEST)
    ? { part, x, y, width, height }
    : undefined;
};

const isLayout = (value: unknown): value is Layout => value === 1 || value === 2 || value === 3;

const pathFrom = ([anchor, layout, rawDetail, ...fields]: unknown[]): Path | undefined => {
  const detail = detailFrom(rawDetail);
  if (!isName(anchor) || !isLayout(layout) || detail === undefined) return undefined;
  if (fields.length === 0 || fields.length > MOST_SAMPLES) return undefined;
  const samples: Sample[] = [];
  for (const field of fields) {
    const sample = sampleFrom(field);
    const previous = samples.at(-1);
    if (!sample || (previous && sample.age > previous.age)) return undefined;
    samples.push(sample);
  }
  return detail ? { anchor, layout, detail, samples } : { anchor, layout, samples };
};

const spanFrom = (value: unknown): Span | undefined => {
  if (!Array.isArray(value)) return undefined;
  const [anchor, start, end, ...rest] = value;
  return rest.length === 0 &&
    isName(anchor) &&
    isCount(start, LONGEST_TEXT) &&
    isCount(end, LONGEST_TEXT) &&
    end > start
    ? { anchor, start, end }
    : undefined;
};

const marksFrom = ([layout, direction, ...fields]: unknown[]): Marks | undefined => {
  if (!isLayout(layout) || (direction !== 0 && direction !== 1)) return undefined;
  if (fields.length === 0 || fields.length > MOST_SPANS) return undefined;
  const spans: Span[] = [];
  for (const field of fields) {
    const span = spanFrom(field);
    if (!span) return undefined;
    spans.push(span);
  }
  return direction === 1 ? { layout, spans, backward: true } : { layout, spans };
};

const pullFrom = ([frame, corner, x, y, ...rest]: unknown[]): Pull | undefined =>
  rest.length === 0 && isName(frame) && isCorner(corner) && isStretch(x) && isStretch(y)
    ? { frame, corner, x, y }
    : undefined;

const dropFrom = ([frame, ...rest]: unknown[]) => (rest.length === 0 && isName(frame) ? frame : undefined);

const sampleTo = ({ age, x, y, dx, dy }: Sample) => [
  Math.round(age),
  round(x),
  round(y),
  Math.round(dx),
  Math.round(dy),
];
const pathTo = ({ anchor, layout, detail, samples }: Path) => [
  anchor,
  layout,
  detail ? [detail.part, round(detail.x), round(detail.y), Math.round(detail.width), Math.round(detail.height)] : null,
  ...samples.map(sampleTo),
];
const marksTo = ({ layout, spans, backward }: Marks) => [
  layout,
  backward ? 1 : 0,
  ...spans.map(({ anchor, start, end }) => [anchor, start, end]),
];
const pullTo = ({ frame, corner, x, y }: Pull) => [frame, corner, round(x, 10), round(y, 10)];

const parse = (data: string): unknown[] | undefined => {
  try {
    const value: unknown = JSON.parse(data);
    return Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const bodyTo = (message: Body): unknown[] => {
  switch (message.type) {
    case 'move':
      return pathTo(message.path);
    case 'highlight':
      return marksTo(message.marks);
    case 'pull':
      return pullTo(message.pull);
    case 'drop':
      return [message.frame];
    default:
      return [];
  }
};

function bodyFrom(type: Type | undefined, fields: unknown[]): ClientMessage | undefined {
  switch (type) {
    case 'move': {
      const path = pathFrom(fields);
      return path && { type, path };
    }
    case 'highlight': {
      const marks = marksFrom(fields);
      return marks && { type, marks };
    }
    case 'pull': {
      const pull = pullFrom(fields);
      return pull && { type, pull };
    }
    case 'drop': {
      const frame = dropFrom(fields);
      return frame === undefined ? undefined : { type, frame };
    }
    case 'press':
    case 'click':
    case 'release':
    case 'leave':
    case 'unhighlight':
      return fields.length === 0 ? { type } : undefined;
    default:
      return undefined;
  }
}

export const encodeClient = (message: ClientMessage) => JSON.stringify([TAGS[message.type], ...bodyTo(message)]);

export function decodeClient(data: string): ClientMessage | undefined {
  const [tag, ...fields] = parse(data) ?? [];
  return bodyFrom(TYPES.get(tag), fields);
}

export function encodeServer(message: ServerMessage) {
  switch (message.type) {
    case 'snapshot':
      return JSON.stringify([
        TAGS.snapshot,
        message.cursors.map(({ id, path }) => [id, ...pathTo(path)]),
        message.highlights.map(({ id, marks }) => [id, ...marksTo(marks)]),
      ]);
    case 'gone':
      return JSON.stringify([TAGS.gone, message.id]);
    default:
      return JSON.stringify([TAGS[message.type], message.id, ...bodyTo(message)]);
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
  const [tag, id, ...fields] = parse(data) ?? [];
  const type = TYPES.get(tag);
  if (type === 'snapshot') {
    const [highlights, ...extra] = fields;
    const cursors = listFrom(id, pathFrom);
    const marked = listFrom(highlights, marksFrom);
    if (!cursors || !marked || extra.length) return undefined;
    return {
      type,
      cursors: cursors.map(({ id: owner, value }) => ({ id: owner, path: value })),
      highlights: marked.map(({ id: owner, value }) => ({ id: owner, marks: value })),
    };
  }
  if (!isId(id)) return undefined;
  if (type === 'gone') return fields.length ? undefined : { type, id };
  const body = bodyFrom(type, fields);
  return body && { ...body, id };
}
