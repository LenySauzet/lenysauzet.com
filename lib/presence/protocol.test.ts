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
  layout: 3 as const,
  detail: { part: '1.0.2', x: 0.5, y: 0.25, width: 120, height: 40 },
  samples: [
    { age: 30, x: 0.25, y: 0.5, dx: 0, dy: 0 },
    { age: 0, x: 1, y: 0.5, dx: 12, dy: -4 },
  ],
};
const marks = {
  layout: 3 as const,
  spans: [
    { anchor: 'role', start: 2, end: 9 },
    { anchor: 'intro', start: 0, end: 12 },
  ],
};
const pull = { frame: 'headline', corner: 2 as const, x: 12.5, y: -3 };

describe('the client messages', () => {
  it.each<ClientMessage>([
    { type: 'move', path },
    { type: 'press' },
    { type: 'click' },
    { type: 'release' },
    { type: 'highlight', marks: { ...marks, backward: true } },
    { type: 'leave' },
    { type: 'highlight', marks },
    { type: 'unhighlight' },
    { type: 'pull', pull },
    { type: 'drop', frame: 'headline' },
  ])('survive the wire: %o', (message) => {
    expect(decodeClient(encodeClient(message))).toEqual(message);
  });

  it('round what they carry to keep messages small', () => {
    const sample = { age: 16.4, x: 0.123456789, y: 1 / 3, dx: 4.6, dy: -0.4 };

    expect(encodeClient({ type: 'move', path: { anchor: 'intro', layout: 2, samples: [sample] } })).toBe(
      '["m","intro",2,null,[16,0.1235,0.3333,5,0]]'
    );
    expect(
      encodeClient({
        type: 'move',
        path: {
          anchor: 'intro',
          layout: 2,
          detail: { part: '#12', x: 1 / 3, y: 0.5, width: 9.6, height: 20 },
          samples: [sample],
        },
      })
    ).toBe('["m","intro",2,["#12",0.3333,0.5,10,20],[16,0.1235,0.3333,5,0]]');
    expect(encodeClient({ type: 'pull', pull: { ...pull, x: 1 / 3 } })).toBe('["d","headline",2,0.3,-3]');
  });

  it('fit four samples on the longest anchor and part within what the room reads', () => {
    const sample = { age: 999, x: 0.1234, y: 0.5678, dx: -3999, dy: -3999 };
    const part = Array(16).fill('999').join('.');
    const detail = { part, x: 0.1234, y: 0.5678, width: 3999, height: 3999 };
    const longest = { anchor: 'a'.repeat(64), layout: 3 as const, detail, samples: [sample, sample, sample, sample] };

    expect(decodeClient(encodeClient({ type: 'move', path: longest }))).toBeDefined();
    expect(encodeClient({ type: 'move', path: longest }).length).toBeLessThanOrEqual(MAX_CLIENT_MESSAGE);
  });

  it('fit eight spans on the longest anchors within what the room reads', () => {
    const span = { anchor: 'a'.repeat(64), start: 19_999, end: 20_000 };
    const longest = { layout: 3 as const, spans: Array<typeof span>(8).fill(span), backward: true as const };

    expect(encodeClient({ type: 'highlight', marks: longest }).length).toBeLessThanOrEqual(MAX_CLIENT_MESSAGE);
  });

  it.each([
    'not json',
    '["toString"]',
    '["constructor"]',
    '["__proto__"]',
    '["s",[],[]]',
    '{"m":1}',
    '["m","intro",3,null]',
    '["m","intro",3,["#3",0.5,0.5],[0,0.5,0.5,0,0]]',
    '["m","intro",3,["#3",0.5,0.5,-1,20],[0,0.5,0.5,0,0]]',
    '["m","intro",4,null,[0,0.5,0.5,0,0]]',
    '["m","intro",null,[0,0.5,0.5,0,0]]',
    '["m","intro",3,[0,0.5,0.5,0,0]]',
    '["m","Intro",3,null,[0,0.5,0.5,0,0]]',
    '["m","intro",3,["a.b",0.5,0.5,10,20],[0,0.5,0.5,0,0]]',
    '["m","intro",3,["#",0.5,0.5,10,20],[0,0.5,0.5,0,0]]',
    '["m","intro",3,["",0.5,0.5,10,20],[0,0.5,0.5,0,0]]',
    '["m","intro",3,["1..2",0.5,0.5,10,20],[0,0.5,0.5,0,0]]',
    '["m","intro",3,["#3",1.5,0.5,10,20],[0,0.5,0.5,0,0]]',
    '["m","intro",3,null,[0,0.5,1.5,0,0]]',
    '["m","intro",3,null,[0,0.5,0.5,0.5,0]]',
    '["m","intro",3,null,[0,0.5,0.5,0,5000]]',
    '["m","intro",3,null,[-1,0.5,0.5,0,0]]',
    '["m","intro",3,null,[0,0.5,0.5,0,0],[10,0.5,0.5,0,0]]',
    '["m","intro",3,null,[0,0.5,0.5,0,0],[0,0.5,0.5,0,0],[0,0.5,0.5,0,0],[0,0.5,0.5,0,0],[0,0.5,0.5,0,0]]',
    '["m","intro",3,null,[0,0.5,0.5,0]]',
    `["m","${'a'.repeat(65)}",3,null,[0,0.5,0.5,0,0]]`,
    '["h",3,0]',
    '["h","intro",4,12]',
    '["h",0,["intro",4,12]]',
    '["h",4,0,["intro",4,12]]',
    '["h",3,2,["intro",4,12]]',
    '["h",3,0,["intro",12,4]]',
    '["h",3,0,["intro",1.5,4]]',
    '["h",3,0,["intro",0,99999]]',
    '["h",3,0,["intro",4,12,1]]',
    `["h",3,0,${Array(9).fill('["intro",4,12]').join(',')}]`,
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
    { type: 'snapshot', cursors: [{ id: 'a1', path }], highlights: [{ id: 'a1', marks }] },
    { type: 'snapshot', cursors: [], highlights: [] },
    { type: 'move', id: 'a1', path },
    { type: 'press', id: 'a1' },
    { type: 'click', id: 'a1' },
    { type: 'release', id: 'a1' },
    { type: 'leave', id: 'a1' },
    { type: 'gone', id: 'a1' },
    { type: 'highlight', id: 'a1', marks },
    { type: 'unhighlight', id: 'a1' },
    { type: 'pull', id: 'a1', pull },
    { type: 'drop', id: 'a1', frame: 'metadata' },
  ])('survive the wire: %o', (message) => {
    expect(decodeServer(encodeServer(message))).toEqual(message);
  });

  it.each([
    '["s",[["a1","intro",3,null]],[]]',
    '["s",[]]',
    '["s",[],[],1]',
    '["m","A-1","intro",3,null,[0,0.5,0.5,0,0]]',
    '["d","a1","headline",0,0]',
    '["e","a1"]',
    '["l"]',
    '["g","a1",1]',
    '["toString","a1"]',
  ])('refuses %s', (data) => {
    expect(decodeServer(data)).toBeUndefined();
  });
});
