export interface Point {
  anchor: string;
  x: number;
  y: number;
}

export type ClientMessage = { type: 'move'; point: Point } | { type: 'press' } | { type: 'leave' };

export interface Cursor {
  id: string;
  point: Point;
}

export type ServerMessage =
  | { type: 'snapshot'; cursors: Cursor[] }
  | { type: 'move'; id: string; point: Point }
  | { type: 'press'; id: string }
  | { type: 'leave'; id: string };

export const HEARTBEAT = 'ping';
export const MAX_CLIENT_MESSAGE = 128;
export const EVICTED = 4000;
export const HEARTBEAT_REPLY = 'pong';

const ANCHOR = /^[a-z0-9][a-z0-9:-]{0,63}$/;
const ID = /^[a-z0-9]{1,16}$/;
const REACH = 0.5;
const PRECISION = 1e4;

const round = (value: number) => Math.round(value * PRECISION) / PRECISION;
const isCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= -REACH && value <= 1 + REACH;
const isAnchor = (value: unknown): value is string => typeof value === 'string' && ANCHOR.test(value);
const isId = (value: unknown): value is string => typeof value === 'string' && ID.test(value);

const pointFrom = ([anchor, x, y]: unknown[]): Point | undefined =>
  isAnchor(anchor) && isCoordinate(x) && isCoordinate(y) ? { anchor, x, y } : undefined;

const pointTo = ({ anchor, x, y }: Point) => [anchor, round(x), round(y)];

const parse = (data: string): unknown[] | undefined => {
  try {
    const value: unknown = JSON.parse(data);
    return Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

export function encodeClient(message: ClientMessage) {
  switch (message.type) {
    case 'move':
      return JSON.stringify(['m', ...pointTo(message.point)]);
    case 'press':
      return JSON.stringify(['p']);
    case 'leave':
      return JSON.stringify(['l']);
  }
}

export function decodeClient(data: string): ClientMessage | undefined {
  const [tag, ...rest] = parse(data) ?? [];
  if (tag === 'm' && rest.length === 3) {
    const point = pointFrom(rest);
    return point && { type: 'move', point };
  }
  if (tag === 'p' && rest.length === 0) return { type: 'press' };
  if (tag === 'l' && rest.length === 0) return { type: 'leave' };
  return undefined;
}

export function encodeServer(message: ServerMessage) {
  switch (message.type) {
    case 'snapshot':
      return JSON.stringify(['s', message.cursors.map(({ id, point }) => [id, ...pointTo(point)])]);
    case 'move':
      return JSON.stringify(['m', message.id, ...pointTo(message.point)]);
    case 'press':
      return JSON.stringify(['p', message.id]);
    case 'leave':
      return JSON.stringify(['l', message.id]);
  }
}

const cursorFrom = (value: unknown): Cursor | undefined => {
  if (!Array.isArray(value) || value.length !== 4) return undefined;
  const [id, ...rest] = value;
  const point = pointFrom(rest);
  return isId(id) && point ? { id, point } : undefined;
};

export function decodeServer(data: string): ServerMessage | undefined {
  const [tag, id, ...rest] = parse(data) ?? [];
  if (tag === 's' && Array.isArray(id) && rest.length === 0) {
    const cursors = id.map(cursorFrom);
    return cursors.every(Boolean) ? { type: 'snapshot', cursors: cursors as Cursor[] } : undefined;
  }
  if (!isId(id)) return undefined;
  if (tag === 'm' && rest.length === 3) {
    const point = pointFrom(rest);
    return point && { type: 'move', id, point };
  }
  if (tag === 'p' && rest.length === 0) return { type: 'press', id };
  if (tag === 'l' && rest.length === 0) return { type: 'leave', id };
  return undefined;
}
