import { exports } from 'cloudflare:workers';
import { afterEach, describe, expect, it } from 'vitest';

import { decodeServer, encodeClient, EVICTED, MAX_CLIENT_MESSAGE, type ServerMessage } from '../../../lib/presence/protocol';

const ORIGIN = 'https://lenysauzet.com';
const path = {
  anchor: 'project:ankhora',
  layout: 3 as const,
  detail: { part: '0', x: 0.5, y: 0.5, width: 100, height: 40 },
  samples: [
    { age: 20, x: 0.2, y: 0.5, dx: 0, dy: 0 },
    { age: 0, x: 0.25, y: 0.5, dx: 0, dy: 8 },
  ],
};
const last = { anchor: 'project:ankhora', layout: 3 as const, detail: { part: '0', x: 0.5, y: 0.5, width: 100, height: 40 }, samples: [{ age: 0, x: 0.25, y: 0.5, dx: 0, dy: 8 }] };
const pull = { frame: 'headline', corner: 1 as const, x: 12, y: -6 };
const marks = { spans: [{ anchor: 'intro', start: 4, end: 12 }] };
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

    mover.socket.send(encodeClient({ type: 'move', path }));
    mover.socket.send(encodeClient({ type: 'press' }));

    expect(await watcher.next()).toMatchObject({ type: 'move', path });
    expect(await watcher.next()).toMatchObject({ type: 'press' });
    expect(await mover.silent()).toBe(true);
  });

  it('shows a newcomer where everyone already is', async () => {
    const mover = await connect();
    const watcher = await connect();
    await mover.next();
    await watcher.next();
    mover.socket.send(encodeClient({ type: 'move', path }));
    const moved = await watcher.next();

    const newcomer = await connect();

    expect(await newcomer.next()).toEqual({ type: 'snapshot', cursors: [{ id: idOf(moved), path: last }], highlights: [] });
  });

  it('lets the others know when a cursor leaves the page or the visitor goes', async () => {
    const leaver = await connect();
    const watcher = await connect();
    await leaver.next();
    await watcher.next();

    leaver.socket.send(encodeClient({ type: 'move', path }));
    const id = idOf(await watcher.next());
    leaver.socket.send(encodeClient({ type: 'leave' }));
    expect(await watcher.next()).toEqual({ type: 'leave', id });

    leaver.socket.close(1000, 'bye');
    expect(await watcher.next()).toEqual({ type: 'gone', id });
  });

  it('forgets where a cursor was once it has left the page', async () => {
    const leaver = await connect();
    await leaver.next();
    leaver.socket.send(encodeClient({ type: 'move', path }));
    leaver.socket.send(encodeClient({ type: 'leave' }));
    await idle();

    const newcomer = await connect();

    expect(await newcomer.next()).toEqual({ type: 'snapshot', cursors: [], highlights: [] });
  });

  it('relays a highlight, keeps it for newcomers until it is cleared, and a release', async () => {
    const reader = await connect();
    const watcher = await connect();
    await reader.next();
    await watcher.next();

    reader.socket.send(encodeClient({ type: 'highlight', marks }));
    const highlighted = await watcher.next();
    expect(highlighted).toMatchObject({ type: 'highlight', marks });

    reader.socket.send(encodeClient({ type: 'leave' }));
    await watcher.next();
    const newcomer = await connect();
    expect(await newcomer.next()).toEqual({ type: 'snapshot', cursors: [], highlights: [{ id: idOf(highlighted), marks }] });

    reader.socket.send(encodeClient({ type: 'unhighlight' }));
    reader.socket.send(encodeClient({ type: 'release' }));
    expect(await watcher.next()).toEqual({ type: 'unhighlight', id: idOf(highlighted) });
    expect(await watcher.next()).toEqual({ type: 'release', id: idOf(highlighted) });
  });

  it('relays a frame pulled and let go', async () => {
    const puller = await connect();
    const watcher = await connect();
    await puller.next();
    await watcher.next();

    puller.socket.send(encodeClient({ type: 'pull', pull }));
    puller.socket.send(encodeClient({ type: 'drop', frame: 'headline' }));

    const pulled = await watcher.next();
    expect(pulled).toMatchObject({ type: 'pull', pull });
    expect(await watcher.next()).toEqual({ type: 'drop', id: idOf(pulled), frame: 'headline' });
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
      visitor.socket.send(encodeClient({ type: 'move', path }));
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

    sender.socket.send(encodeClient({ type: 'move', path }).padEnd(MAX_CLIENT_MESSAGE + 1));

    expect(await watcher.silent()).toBe(true);
  });

  it('drops what it cannot read, and what comes faster than it allows', async () => {
    const flooder = await connect();
    const watcher = await connect();
    await flooder.next();
    await watcher.next();

    const startedAt = Date.now();
    flooder.socket.send('["m","<script>",3,null,[0,0.5,0.5,0,0]]');
    for (let index = 0; index < 400; index += 1) flooder.socket.send(encodeClient({ type: 'press' }));

    const received: ServerMessage[] = [];
    for (let message = await settled(watcher.next()); message; message = await settled(watcher.next())) received.push(message);
    const seconds = (Date.now() - startedAt) / 1000;

    expect(received.every((message) => message.type === 'press')).toBe(true);
    expect(received.length).toBeGreaterThanOrEqual(120);
    expect(received.length).toBeLessThanOrEqual(120 + Math.ceil(75 * seconds));
  });
});

const idle = () => new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 150));
const settled = (message: Promise<ServerMessage>) => Promise.race([message, idle()]);
