import { exports } from 'cloudflare:workers';
import { afterEach, describe, expect, it } from 'vitest';

import { decodeServer, encodeClient, EVICTED, type ServerMessage } from '../../../lib/presence/protocol';

const ORIGIN = 'https://lenysauzet.com';
const point = { anchor: 'project:ankhora', x: 0.25, y: 0.5 };
const open: { socket: WebSocket; closed: Promise<number> }[] = [];

async function connect(address?: string) {
  const response = await exports.default.fetch('https://presence.test/', {
    headers: { Upgrade: 'websocket', Origin: ORIGIN, ...(address && { 'CF-Connecting-IP': address }) },
  });
  const socket = response.webSocket;
  if (!socket) throw new Error(`No WebSocket: ${response.status}`);

  const inbox: ServerMessage[] = [];
  const waiting: ((message: ServerMessage) => void)[] = [];
  socket.addEventListener('message', (event: MessageEvent) => {
    const message = decodeServer(event.data as string);
    if (!message) return;
    const resolve = waiting.shift();
    if (resolve) resolve(message);
    else inbox.push(message);
  });
  socket.accept();

  const next = () =>
    new Promise<ServerMessage>((resolve) => {
      const queued = inbox.shift();
      if (queued) resolve(queued);
      else waiting.push(resolve);
    });

  const silent = async () => (await Promise.race([next(), idle()])) === undefined;

  const closed = new Promise<number>((resolve) => socket.addEventListener('close', (event: CloseEvent) => resolve(event.code)));
  open.push({ socket, closed });

  return { socket, next, silent, closed };
}

const idOf = (message: ServerMessage) => ('id' in message ? message.id : undefined);

afterEach(async () => {
  const closing = open.splice(0);
  for (const { socket } of closing) socket.close(1000, 'done');
  await Promise.all(closing.map(({ closed }) => closed));
  await idle();
});

describe('the presence worker', () => {
  it('refuses a page from another site', async () => {
    const response = await exports.default.fetch('https://presence.test/', {
      headers: { Upgrade: 'websocket', Origin: 'https://elsewhere.example' },
    });

    expect(response.status).toBe(403);
  });

  it('refuses anything but a WebSocket', async () => {
    const response = await exports.default.fetch('https://presence.test/', { headers: { Origin: ORIGIN } });

    expect(response.status).toBe(426);
  });

  it('relays a cursor to the others, never back to its owner', async () => {
    const mover = await connect();
    const watcher = await connect();
    await mover.next();
    await watcher.next();

    mover.socket.send(encodeClient({ type: 'move', point }));
    mover.socket.send(encodeClient({ type: 'press' }));

    expect(await watcher.next()).toMatchObject({ type: 'move', point });
    expect(await watcher.next()).toMatchObject({ type: 'press' });
    expect(await mover.silent()).toBe(true);
  });

  it('shows a newcomer where everyone already is', async () => {
    const mover = await connect();
    const watcher = await connect();
    await mover.next();
    await watcher.next();
    mover.socket.send(encodeClient({ type: 'move', point }));
    const moved = await watcher.next();

    const newcomer = await connect();

    expect(await newcomer.next()).toEqual({ type: 'snapshot', cursors: [{ id: idOf(moved), point }] });
  });

  it('lets the others know when a cursor leaves the page or the visitor goes', async () => {
    const leaver = await connect();
    const watcher = await connect();
    await leaver.next();
    await watcher.next();

    leaver.socket.send(encodeClient({ type: 'move', point }));
    const id = idOf(await watcher.next());
    leaver.socket.send(encodeClient({ type: 'leave' }));
    expect(await watcher.next()).toEqual({ type: 'leave', id });

    leaver.socket.close(1000, 'bye');
    expect(await watcher.next()).toEqual({ type: 'leave', id });
  });

  it('forgets where a cursor was once it has left the page', async () => {
    const leaver = await connect();
    await leaver.next();
    leaver.socket.send(encodeClient({ type: 'move', point }));
    leaver.socket.send(encodeClient({ type: 'leave' }));
    await idle();

    const newcomer = await connect();

    expect(await newcomer.next()).toEqual({ type: 'snapshot', cursors: [] });
  });

  it('refuses a fifth connection from one address', async () => {
    for (let index = 0; index < 4; index += 1) await connect('203.0.113.7');

    const response = await exports.default.fetch('https://presence.test/', {
      headers: { Upgrade: 'websocket', Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' },
    });

    expect(response.status).toBe(429);
  });

  it('makes room for a newcomer by letting the idlest visitor go', async () => {
    const idlest = await connect('198.51.100.0');
    await idlest.next();
    const others = [];
    for (let index = 1; index < 24; index += 1) {
      const visitor = await connect(`198.51.100.${index}`);
      await visitor.next();
      visitor.socket.send(encodeClient({ type: 'move', point }));
      others.push(visitor);
    }
    await idle();

    await connect('198.51.100.200');

    expect(await idlest.closed).toBe(EVICTED);
  });

  it('ignores an oversized message without reading it', async () => {
    const sender = await connect();
    const watcher = await connect();
    await sender.next();
    await watcher.next();

    sender.socket.send(`${encodeClient({ type: 'move', point })}${' '.repeat(200)}`);

    expect(await watcher.silent()).toBe(true);
  });

  it('drops what it cannot read, and what comes faster than it allows', async () => {
    const flooder = await connect();
    const watcher = await connect();
    await flooder.next();
    await watcher.next();

    flooder.socket.send('["m","<script>",0.5,0.5]');
    for (let index = 0; index < 100; index += 1) flooder.socket.send(encodeClient({ type: 'press' }));
    flooder.socket.send(encodeClient({ type: 'leave' }));

    const received: ServerMessage[] = [];
    for (let message = await settled(watcher.next()); message; message = await settled(watcher.next())) received.push(message);

    expect(received.every((message) => message.type === 'press')).toBe(true);
    expect(received.length).toBeLessThanOrEqual(41);
  });
});

const idle = () => new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 150));
const settled = (message: Promise<ServerMessage>) => Promise.race([message, idle()]);
