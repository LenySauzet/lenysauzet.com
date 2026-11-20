import { exports } from 'cloudflare:workers';
import { afterEach, describe, expect, it } from 'vitest';

import { decodeServer, encodeClient, type ServerMessage } from '../../../lib/presence/protocol';

const ORIGIN = 'https://lenysauzet.com';
const point = { anchor: 'project:ankhora', x: 0.25, y: 0.5 };
const open: WebSocket[] = [];

async function connect(origin = ORIGIN) {
  const response = await exports.default.fetch('https://presence.test/', {
    headers: { Upgrade: 'websocket', Origin: origin },
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
  open.push(socket);

  const next = () =>
    new Promise<ServerMessage>((resolve) => {
      const queued = inbox.shift();
      if (queued) resolve(queued);
      else waiting.push(resolve);
    });

  const silent = async () => (await Promise.race([next(), idle()])) === undefined;

  return { socket, next, silent };
}

const idOf = (message: ServerMessage) => ('id' in message ? message.id : undefined);

afterEach(() => {
  for (const socket of open.splice(0)) socket.close(1000, 'done');
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
