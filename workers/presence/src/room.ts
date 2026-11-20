import { DurableObject } from 'cloudflare:workers';

import {
  decodeClient,
  encodeServer,
  HEARTBEAT,
  HEARTBEAT_REPLY,
  type Cursor,
  type Point,
  type ServerMessage,
} from '../../../lib/presence/protocol';
import { Budget } from './budget';

const CAPACITY = 64;
const RESERVED_CODES = new Set([1004, 1005, 1006, 1015]);
const BURST = 40;
const PER_SECOND = 30;

interface Visitor {
  id: string;
  point?: Point;
}

const newId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 10);

export class Room extends DurableObject<Env> {
  private readonly budgets = new WeakMap<WebSocket, Budget>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(HEARTBEAT, HEARTBEAT_REPLY));
  }

  async fetch() {
    if (this.ctx.getWebSockets().length >= CAPACITY) return new Response('The room is full', { status: 503 });

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id: newId() } satisfies Visitor);
    server.send(encodeServer({ type: 'snapshot', cursors: this.cursors(server) }));

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, data: string | ArrayBuffer) {
    if (typeof data !== 'string' || !this.affords(socket)) return;

    const message = decodeClient(data);
    if (!message) return;

    const { id } = visitorOf(socket);
    switch (message.type) {
      case 'move':
        socket.serializeAttachment({ id, point: message.point } satisfies Visitor);
        return this.broadcast(socket, { type: 'move', id, point: message.point });
      case 'press':
        return this.broadcast(socket, { type: 'press', id });
      case 'leave':
        socket.serializeAttachment({ id } satisfies Visitor);
        return this.broadcast(socket, { type: 'leave', id });
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

  private depart(socket: WebSocket) {
    this.broadcast(socket, { type: 'leave', id: visitorOf(socket).id });
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

  private cursors(except: WebSocket): Cursor[] {
    return this.ctx
      .getWebSockets()
      .filter((socket) => socket !== except)
      .map(visitorOf)
      .flatMap(({ id, point }) => (point ? [{ id, point }] : []));
  }

  private broadcast(from: WebSocket, message: ServerMessage) {
    const encoded = encodeServer(message);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== from && socket.readyState === WebSocket.OPEN) socket.send(encoded);
    }
  }
}

const visitorOf = (socket: WebSocket) => socket.deserializeAttachment() as Visitor;
