import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FrameEvent } from '@/lib/presence/frames';
import type { Layout, Marks, Path } from '@/lib/presence/protocol';

import { createRoomState } from './room-state';

const path = (layout: Layout): Path => ({
  anchor: 'intro',
  layout,
  samples: [{ age: 0, x: 0.5, y: 0.5, dx: 0, dy: 0 }],
});
const marks = (layout: Layout): Marks => ({ layout, spans: [{ anchor: 'intro', start: 0, end: 4 }] });
const pull = { frame: 'headline', corner: 0 as const, x: 4, y: 2 };

function fakes() {
  const cursors = {
    move: vi.fn(),
    press: vi.fn(),
    release: vi.fn(),
    click: vi.fn(),
    pull: vi.fn(),
    drop: vi.fn(),
    leave: vi.fn(),
    remove: vi.fn(),
    keepOnly: vi.fn(),
  };
  const highlights = { show: vi.fn(), hide: vi.fn(), keepOnly: vi.fn() };
  const received: FrameEvent[] = [];
  const frames = { receive: (event: FrameEvent) => received.push(event) };
  return { cursors, highlights, frames, received };
}

describe('the room state', () => {
  let world: ReturnType<typeof fakes>;
  let layout: Layout;
  let room: ReturnType<typeof createRoomState>;

  beforeEach(() => {
    world = fakes();
    layout = 3;
    room = createRoomState({ ...world, layoutNow: () => layout });
  });

  it('shows a visitor on the same layout, and hides one on another', () => {
    room.receive({ type: 'move', id: 'a', path: path(3) });
    room.receive({ type: 'move', id: 'b', path: path(2) });

    expect(world.cursors.move).toHaveBeenCalledWith('a', path(3));
    expect(world.cursors.remove).toHaveBeenCalledWith('b');
  });

  it('shows a selection by its own layout, even once its owner has left the page', () => {
    room.receive({ type: 'highlight', id: 'a', marks: marks(3) });
    room.receive({ type: 'highlight', id: 'b', marks: marks(1) });

    expect(world.highlights.show).toHaveBeenCalledWith('a', marks(3));
    expect(world.highlights.hide).toHaveBeenCalledWith('b');
  });

  it('regroups when this page crosses a breakpoint', () => {
    room.receive({ type: 'move', id: 'a', path: path(2) });
    room.receive({ type: 'highlight', id: 'a', marks: marks(2) });
    world.cursors.move.mockClear();

    layout = 2;
    room.regroup();

    expect(world.cursors.move).toHaveBeenCalledWith('a', path(2));
    expect(world.highlights.show).toHaveBeenCalledWith('a', marks(2));
  });

  it('plays pulls through the cursors, and passes on what they play', () => {
    room.receive({ type: 'move', id: 'a', path: path(3) });
    room.receive({ type: 'pull', id: 'a', pull });
    expect(world.cursors.pull).toHaveBeenCalledWith('a', pull);

    room.framed('a', { type: 'pull', pull });
    room.framed('a', { type: 'drop', frame: 'headline' });
    expect(world.received).toEqual([
      { type: 'pull', pull },
      { type: 'drop', frame: 'headline' },
    ]);
  });

  it('lets go of a frame whose puller is gone, is lost, or leaves for another layout', () => {
    for (const end of [
      () => room.receive({ type: 'gone', id: 'a' }),
      () => room.reset(),
      () => room.receive({ type: 'move', id: 'a', path: path(1) }),
    ]) {
      world.received.length = 0;
      room.receive({ type: 'move', id: 'a', path: path(3) });
      room.framed('a', { type: 'pull', pull });
      end();
      expect(world.received.at(-1)).toEqual({ type: 'drop', frame: 'headline' });
    }
  });

  it('ignores a drop for a frame it never saw pulled', () => {
    room.framed('a', { type: 'drop', frame: 'headline' });

    expect(world.received).toEqual([]);
  });

  it('starts over from a snapshot, everyone else forgotten', () => {
    room.receive({ type: 'move', id: 'old', path: path(3) });
    room.receive({
      type: 'snapshot',
      cursors: [{ id: 'a', path: path(3) }],
      highlights: [{ id: 'a', marks: marks(3) }],
    });

    expect(world.cursors.keepOnly).toHaveBeenCalledWith(new Set());
    expect(world.cursors.move).toHaveBeenLastCalledWith('a', path(3));
    expect(world.highlights.show).toHaveBeenLastCalledWith('a', marks(3));
  });
});
