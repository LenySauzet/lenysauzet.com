import { describe, expect, it } from 'vitest';

import {
  decodeClient,
  decodeServer,
  encodeClient,
  encodeServer,
  MAX_CLIENT_MESSAGE,
  type ClientMessage,
  type ServerMessage,
} from './protocol';

const path = {
  anchor: 'project:ankhora',
  detail: { part: '1.0.2', x: 0.5, y: 0.25 },
  samples: [
    { age: 30, x: 0.25, y: 0.5, dx: 0, dy: 0 },
    { age: 0, x: 1, y: 0.5, dx: 12, dy: -4 },
  ],
};
const span = { anchor: 'intro', start: 4, end: 12 };
const pull = { frame: 'headline', corner: 2 as const, x: 12.5, y: -3 };

describe('the client messages', () => {
  it.each<ClientMessage>([
    { type: 'move', path },
    { type: 'press' },
    { type: 'click' },
    { type: 'release' },
    { type: 'highlight', span: { ...span, backward: true } },
    { type: 'leave' },
    { type: 'highlight', span },
    { type: 'unhighlight' },
    { type: 'pull', pull },
    { type: 'drop', frame: 'headline' },
  ])('survive the wire: %o', (message) => {
    expect(decodeClient(encodeClient(message))).toEqual(message);
  });

  it('round what they carry to keep messages small', () => {
    const sample = { age: 16.4, x: 0.123456789, y: 1 / 3, dx: 4.6, dy: -0.4 };

    expect(encodeClient({ type: 'move', path: { anchor: 'intro', samples: [sample] } })).toBe(
      '["m","intro",null,[16,0.1235,0.3333,5,0]]'
    );
    expect(
      encodeClient({ type: 'move', path: { anchor: 'intro', detail: { part: '#12', x: 1 / 3, y: 0.5 }, samples: [sample] } })
    ).toBe('["m","intro",["#12",0.3333,0.5],[16,0.1235,0.3333,5,0]]');
    expect(encodeClient({ type: 'pull', pull: { ...pull, x: 1 / 3 } })).toBe('["d","headline",2,0.3,-3]');
  });

  it('fit four samples on the longest anchor and part within what the room reads', () => {
    const sample = { age: 999, x: 0.1234, y: 0.5678, dx: -3999, dy: -3999 };
    const part = Array(16).fill('999').join('.');
    const detail = { part, x: 0.1234, y: 0.5678 };
    const longest = { anchor: 'a'.repeat(64), detail, samples: [sample, sample, sample, sample] };

    expect(decodeClient(encodeClient({ type: 'move', path: longest }))).toBeDefined();
    expect(encodeClient({ type: 'move', path: longest }).length).toBeLessThanOrEqual(MAX_CLIENT_MESSAGE);
  });

  it.each([
    'not json',
    '{"m":1}',
    '["m","intro",null]',
    '["m","intro",[0,0.5,0.5,0,0]]',
    '["m","Intro",null,[0,0.5,0.5,0,0]]',
    '["m","intro",["a.b",0.5,0.5],[0,0.5,0.5,0,0]]',
    '["m","intro",["#",0.5,0.5],[0,0.5,0.5,0,0]]',
    '["m","intro",["",0.5,0.5],[0,0.5,0.5,0,0]]',
    '["m","intro",["1..2",0.5,0.5],[0,0.5,0.5,0,0]]',
    '["m","intro",["#3",1.5,0.5],[0,0.5,0.5,0,0]]',
    '["m","intro",null,[0,0.5,1.5,0,0]]',
    '["m","intro",null,[0,0.5,0.5,0.5,0]]',
    '["m","intro",null,[0,0.5,0.5,0,5000]]',
    '["m","intro",null,[-1,0.5,0.5,0,0]]',
    '["m","intro",null,[0,0.5,0.5,0,0],[10,0.5,0.5,0,0]]',
    '["m","intro",null,[0,0.5,0.5,0,0],[0,0.5,0.5,0,0],[0,0.5,0.5,0,0],[0,0.5,0.5,0,0],[0,0.5,0.5,0,0]]',
    '["m","intro",null,[0,0.5,0.5,0]]',
    `["m","${'a'.repeat(65)}",null,[0,0.5,0.5,0,0]]`,
    '["h","intro",12,4]',
    '["h","intro",1.5,4]',
    '["h","intro",0,99999]',
    '["h","intro",4,12,0]',
    '["h","intro",4,12,1,1]',
    '["d","headline",4,0,0]',
    '["d","headline",0,65,0]',
    '["d","headline",0,0]',
    '["e"]',
    '["e","Headline"]',
    '["p",1]',
    '["g"]',
    '["x"]',
  ])('refuses %s', (data) => {
    expect(decodeClient(data)).toBeUndefined();
  });
});

describe('the server messages', () => {
  it.each<ServerMessage>([
    { type: 'snapshot', cursors: [{ id: 'a1', path }], highlights: [{ id: 'a1', span }] },
    { type: 'snapshot', cursors: [], highlights: [] },
    { type: 'move', id: 'a1', path },
    { type: 'press', id: 'a1' },
    { type: 'click', id: 'a1' },
    { type: 'release', id: 'a1' },
    { type: 'leave', id: 'a1' },
    { type: 'gone', id: 'a1' },
    { type: 'highlight', id: 'a1', span },
    { type: 'unhighlight', id: 'a1' },
    { type: 'pull', id: 'a1', pull },
    { type: 'drop', id: 'a1', frame: 'metadata' },
  ])('survive the wire: %o', (message) => {
    expect(decodeServer(encodeServer(message))).toEqual(message);
  });

  it.each([
    '["s",[["a1","intro",null]],[]]',
    '["s",[]]',
    '["s",[],[],1]',
    '["m","A-1","intro",null,[0,0.5,0.5,0,0]]',
    '["d","a1","headline",0,0]',
    '["e","a1"]',
    '["l"]',
    '["g","a1",1]',
  ])('refuses %s', (data) => {
    expect(decodeServer(data)).toBeUndefined();
  });
});
