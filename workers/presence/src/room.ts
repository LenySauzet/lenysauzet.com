import { DurableObject } from 'cloudflare:workers';

import {
  decodeClient,
  encodeServer,
  EVICTED,
  FLOODING,
  HEARTBEAT,
  HEARTBEAT_REPLY,
  MAX_CLIENT_MESSAGE,
  type ClientMessage,
  type Cursor,
  type Highlight,
  type Marks,
  type Path,
  type ServerMessage,
} from '../../../lib/presence/protocol';
import { networkOf } from './address';
import { Budget } from './budget';

const CAPACITY = 24;
const PER_ADDRESS = 4;
const BURST = 120;
const PER_SECOND = 75;
const MOST_OVERDRAWN = 150;
const REMEMBER_PATH_EVERY = 250;
const RESERVED_CODES = new Set([1004, 1005, 1006, 1015]);

interface Visitor {
  id: string;
  activeAt: number;
  path?: Path;
  marks?: Marks;
  departed?: true;
}

const newId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 10);

async function addressTag(address: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(networkOf(address)));
  return [...new Uint8Array(digest).slice(0, 8)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const visitorOf = (socket: WebSocket) => socket.deserializeAttachment() as Visitor;

const lastOf = (path: Path): Path => ({
  ...path,
  samples: path.samples.slice(-1).map((sample) => ({ ...sample, age: 0 })),
});

const changesFor = (message: ClientMessage, visitor: Visitor, now: number): Partial<Visitor> => {
  switch (message.type) {
    case 'move':
      return now - visitor.activeAt >= REMEMBER_PATH_EVERY || !visitor.path ? { path: lastOf(message.path) } : {};
    case 'leave':
      return { path: undefined };
    case 'highlight':
      return { marks: message.marks };
    case 'unhighlight':
      return { marks: undefined };
    default:
      return {};
  }
};

export class Room extends DurableObject<Env> {
  private readonly budgets = new WeakMap<WebSocket, Budget>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(HEARTBEAT, HEARTBEAT_REPLY));
  }

  async fetch(request: Request) {
    const address = request.headers.get('CF-Connecting-IP');
    const tags = address ? [await addressTag(address)] : [];
    if (tags.some((tag) => this.openSockets(tag).length >= PER_ADDRESS))
      return new Response('Too many connections', { status: 429 });

    if (this.openSockets().length >= CAPACITY) this.evictTheIdlest();

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server, tags);
    server.serializeAttachment({ id: newId(), activeAt: Date.now() } satisfies Visitor);
    server.send(encodeServer({ type: 'snapshot', ...this.snapshot(server) }));

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, data: string | ArrayBuffer) {
    const budget = this.budgetOf(socket);
    const now = Date.now();
    if (!budget.spend(now)) {
      if (budget.overdrawn > MOST_OVERDRAWN) this.dismiss(socket, FLOODING, 'flooding');
      return;
    }
    if (typeof data !== 'string' || data.length > MAX_CLIENT_MESSAGE) return;

    const message = decodeClient(data);
    if (!message) return;

    const visitor = visitorOf(socket);
    const changes = changesFor(message, visitor, now);
    if (message.type !== 'move' || 'path' in changes)
      socket.serializeAttachment({ ...visitor, ...changes, activeAt: now } satisfies Visitor);
    this.broadcast(socket, { ...message, id: visitor.id });
  }

  webSocketClose(socket: WebSocket, code: number, reason: string) {
    this.announceGone(socket);
    if (RESERVED_CODES.has(code)) socket.close();
    else socket.close(code, reason);
  }

  webSocketError(socket: WebSocket) {
    this.announceGone(socket);
  }

  private evictTheIdlest() {
    const [idlest] = this.openSockets().sort((a, b) => visitorOf(a).activeAt - visitorOf(b).activeAt);
    if (idlest) this.dismiss(idlest, EVICTED, 'idle');
  }

  private dismiss(socket: WebSocket, code: number, reason: string) {
    this.announceGone(socket);
    socket.close(code, reason);
  }

  private announceGone(socket: WebSocket) {
    const visitor = visitorOf(socket);
    if (visitor.departed) return;
    socket.serializeAttachment({ ...visitor, departed: true } satisfies Visitor);
    this.broadcast(socket, { type: 'gone', id: visitor.id });
  }

  private budgetOf(socket: WebSocket) {
    let budget = this.budgets.get(socket);
    if (!budget) {
      budget = new Budget(BURST, PER_SECOND, Date.now());
      this.budgets.set(socket, budget);
    }
    return budget;
  }

  private snapshot(except: WebSocket): { cursors: Cursor[]; highlights: Highlight[] } {
    const visitors = this.openSockets()
      .filter((socket) => socket !== except)
      .map(visitorOf);

    return {
      cursors: visitors.flatMap(({ id, path }) => (path ? [{ id, path }] : [])),
      highlights: visitors.flatMap(({ id, marks }) => (marks ? [{ id, marks }] : [])),
    };
  }

  private openSockets(tag?: string) {
    return this.ctx.getWebSockets(tag).filter((socket) => socket.readyState === WebSocket.OPEN);
  }

  private broadcast(from: WebSocket, message: ServerMessage) {
    const encoded = encodeServer(message);
    for (const socket of this.openSockets()) if (socket !== from) socket.send(encoded);
  }
}
