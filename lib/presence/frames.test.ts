import { describe, expect, it, vi } from 'vitest';

import { createFrameChannel } from './frames';

const pull = { frame: 'headline', corner: 0 as const, x: 4, y: 2 };

describe('the frame channel', () => {
  it('hands what a frame shares to the room, until it stops listening', () => {
    const channel = createFrameChannel();
    const room = vi.fn();
    const stop = channel.onShared(room);

    channel.share({ type: 'pull', pull });
    stop();
    channel.share({ type: 'drop', frame: 'headline' });

    expect(room).toHaveBeenCalledExactlyOnceWith({ type: 'pull', pull });
  });

  it('hands what the room receives to the frame it names only', () => {
    const channel = createFrameChannel();
    const headline = vi.fn();
    const metadata = vi.fn();
    channel.onReceived('headline', headline);
    const stop = channel.onReceived('metadata', metadata);

    channel.receive({ type: 'pull', pull });
    stop();
    channel.receive({ type: 'drop', frame: 'metadata' });

    expect(headline).toHaveBeenCalledExactlyOnceWith({ type: 'pull', pull });
    expect(metadata).not.toHaveBeenCalled();
  });
});
