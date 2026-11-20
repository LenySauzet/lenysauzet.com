import { DurableObject } from 'cloudflare:workers';

import {
  decodeClient,
  encodeServer,
  EVICTED,
  HEARTBEAT,
  HEARTBEAT_REPLY,
  MAX_CLIENT_MESSAGE,
  type Cursor,
  type Highlight,
  type Path,
  type ServerMessage,
  type Span,
} from '../../../lib/presence/protocol';
import { Budget } from './budget';

const CAPACITY = 24;
const PER_ADDRESS = 4;
const BURST = 120;
const PER_SECOND = 75;
const RESERVED_CODES = new Set([1004, 1005, 1006, 1015]);

interface Visitor {
  id: string;
  activeAt: number;
  path?: Path;
  span?: Span;
}

const newId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 10);

async function addressTag(address: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address));
  return [...new Uint8Array(digest).slice(0, 8)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class Room extends DurableObject<Env> {
  private readonly budgets = new WeakMap<WebSocket, Budget>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(HEARTBEAT, HEARTBEAT_REPLY));
  }

  async fetch(request: Request) {
    const address = request.headers.get('CF-Connecting-IP');
    const tags = address ? [await addressTag(address)] : [];
    if (tags.some((tag) => this.ctx.getWebSockets(tag).length >= PER_ADDRESS))
      return new Response('Too many connections', { status: 429 });

    if (this.ctx.getWebSockets().length >= CAPACITY) this.evictTheIdlest();

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server, tags);
    server.serializeAttachment({ id: newId(), activeAt: Date.now() } satisfies Visitor);
    server.send(encodeServer({ type: 'snapshot', ...this.snapshot(server) }));

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, data: string | ArrayBuffer) {
    if (!this.affords(socket) || typeof data !== 'string' || data.length > MAX_CLIENT_MESSAGE) return;

    const message = decodeClient(data);
    if (!message) return;

    const visitor = visitorOf(socket);
    const { id } = visitor;
    const remember = (changes: Partial<Visitor>) =>
      socket.serializeAttachment({ ...visitor, ...changes, activeAt: Date.now() } satisfies Visitor);

    switch (message.type) {
      case 'move':
        remember({ path: lastOf(message.path) });
        return this.broadcast(socket, { type: 'move', id, path: message.path });
      case 'leave':
        remember({ path: undefined });
        return this.broadcast(socket, { type: 'leave', id });
      case 'highlight':
        remember({ span: message.span });
        return this.broadcast(socket, { type: 'highlight', id, span: message.span });
      case 'unhighlight':
        remember({ span: undefined });
        return this.broadcast(socket, { type: 'unhighlight', id });
      case 'pull':
        remember({});
        return this.broadcast(socket, { type: 'pull', id, pull: message.pull });
      case 'drop':
        remember({});
        return this.broadcast(socket, { type: 'drop', id, frame: message.frame });
      default:
        remember({});
        return this.broadcast(socket, { type: message.type, id });
    }
  }

  webSocketClose(socket: WebSocket, code: number, reason: string) {
    this.depart(socket);
    if (RESERVED_CODES.has(code)) socket.close();
    else socket.close(code, reason);
  }

  webSocketError(socket: WebSocket) {
    this.depart(socket);
  }

  private evictTheIdlest() {
    const [idlest] = this.ctx
      .getWebSockets()
      .sort((a, b) => visitorOf(a).activeAt - visitorOf(b).activeAt);
    if (!idlest) return;
    this.depart(idlest);
    idlest.close(EVICTED, 'idle');
  }

  private depart(socket: WebSocket) {
    this.broadcast(socket, { type: 'gone', id: visitorOf(socket).id });
  }

  private affords(socket: WebSocket) {
    const now = Date.now();
    let budget = this.budgets.get(socket);
    if (!budget) {
      budget = new Budget(BURST, PER_SECOND, now);
      this.budgets.set(socket, budget);
    }
    return budget.spend(now);
  }

  private snapshot(except: WebSocket): { cursors: Cursor[]; highlights: Highlight[] } {
    const visitors = this.ctx
      .getWebSockets()
      .filter((socket) => socket !== except)
      .map(visitorOf);

    return {
      cursors: visitors.flatMap(({ id, path }) => (path ? [{ id, path }] : [])),
      highlights: visitors.flatMap(({ id, span }) => (span ? [{ id, span }] : [])),
    };
  }

  private broadcast(from: WebSocket, message: ServerMessage) {
    const encoded = encodeServer(message);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== from && socket.readyState === WebSocket.OPEN) socket.send(encoded);
    }
  }
}

const visitorOf = (socket: WebSocket) => socket.deserializeAttachment() as Visitor;

const lastOf = (path: Path): Path => ({
  ...path,
  samples: path.samples.slice(-1).map((sample) => ({ ...sample, age: 0 })),
});
