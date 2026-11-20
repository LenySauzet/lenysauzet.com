import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { connect, retryDelay } from './connection';
import { encodeServer, EVICTED } from './protocol';

class FakeSocket extends EventTarget {
  static OPEN = 1;
  static made: FakeSocket[] = [];
  readyState = 0;
  sent: string[] = [];

  constructor(readonly url: string) {
    super();
    FakeSocket.made.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent('close', { code: 1000 }));
  }

  opened() {
    this.readyState = FakeSocket.OPEN;
    this.dispatchEvent(new Event('open'));
  }

  dropped(code = 1006) {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent('close', { code }));
  }
}

const latest = () => FakeSocket.made.at(-1)!;

describe('retryDelay', () => {
  it('backs off exponentially, jittered, up to a ceiling', () => {
    expect(retryDelay(0, () => 1)).toBe(1000);
    expect(retryDelay(3, () => 1)).toBe(8000);
    expect(retryDelay(3, () => 0)).toBe(4000);
    expect(retryDelay(20, () => 1)).toBe(30_000);
  });
});

describe('connect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.made = [];
    vi.stubGlobal('WebSocket', FakeSocket);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('hands on what the room says, and reconnects when the line drops', () => {
    const received = vi.fn();
    connect('wss://presence.test', received);
    latest().opened();

    latest().dispatchEvent(new MessageEvent('message', { data: encodeServer({ type: 'leave', id: 'a1' }) }));
    expect(received).toHaveBeenCalledWith({ type: 'leave', id: 'a1' });

    latest().dropped();
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.made).toHaveLength(2);
  });

  it('stays down once evicted for idling, until woken', () => {
    const connection = connect('wss://presence.test', vi.fn());
    latest().opened();

    latest().dropped(EVICTED);
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.made).toHaveLength(1);

    connection.wake();
    expect(FakeSocket.made).toHaveLength(2);
  });

  it('sleeps without reconnecting, and only sends while open', () => {
    const connection = connect('wss://presence.test', vi.fn());
    connection.send({ type: 'press' });
    expect(latest().sent).toEqual([]);

    latest().opened();
    connection.send({ type: 'press' });
    expect(latest().sent).toEqual(['["p"]']);

    connection.sleep();
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.made).toHaveLength(1);
  });
});
