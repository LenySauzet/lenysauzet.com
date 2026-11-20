import { describe, expect, it } from 'vitest';

import { decodeClient, decodeServer, encodeClient, encodeServer, type ClientMessage, type ServerMessage } from './protocol';

const point = { anchor: 'project:ankhora', x: 0.25, y: 0.5 };
const span = { anchor: 'intro', start: 4, end: 12 };

describe('the client messages', () => {
  it.each<ClientMessage>([
    { type: 'move', point },
    { type: 'press' },
    { type: 'release' },
    { type: 'leave' },
    { type: 'highlight', span },
    { type: 'unhighlight' },
  ])('survive the wire: %o', (message) => {
    expect(decodeClient(encodeClient(message))).toEqual(message);
  });

  it('round coordinates to keep messages small', () => {
    expect(encodeClient({ type: 'move', point: { anchor: 'hero', x: 0.123456789, y: 1 / 3 } })).toBe(
      '["m","hero",0.1235,0.3333]'
    );
  });

  it.each([
    'not json',
    '{"m":1}',
    '["m","hero",0.5]',
    '["m","Hero",0.5,0.5]',
    '["m","hero",0.5,9]',
    '["m","hero",null,0.5]',
    '["m","hero",0.5,0.5,1]',
    `["m","${'a'.repeat(65)}",0.5,0.5]`,
    '["h","intro",12,4]',
    '["h","intro",1.5,4]',
    '["h","intro",0,99999]',
    '["p",1]',
    '["g"]',
    '["x"]',
  ])('refuses %s', (data) => {
    expect(decodeClient(data)).toBeUndefined();
  });
});

describe('the server messages', () => {
  it.each<ServerMessage>([
    { type: 'snapshot', cursors: [{ id: 'a1', point }], highlights: [{ id: 'a1', span }] },
    { type: 'snapshot', cursors: [], highlights: [] },
    { type: 'move', id: 'a1', point },
    { type: 'press', id: 'a1' },
    { type: 'release', id: 'a1' },
    { type: 'leave', id: 'a1' },
    { type: 'gone', id: 'a1' },
    { type: 'highlight', id: 'a1', span },
    { type: 'unhighlight', id: 'a1' },
  ])('survive the wire: %o', (message) => {
    expect(decodeServer(encodeServer(message))).toEqual(message);
  });

  it.each([
    '["s",[["a1","hero",0.5]],[]]',
    '["s",[]]',
    '["s",[],[],1]',
    '["m","A-1","hero",0.5,0.5]',
    '["l"]',
    '["g","a1",1]',
  ])('refuses %s', (data) => {
    expect(decodeServer(data)).toBeUndefined();
  });
});
