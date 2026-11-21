import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRipples } from './ripple';

describe('the ripples', () => {
  let layer: HTMLElement;
  let ripples: ReturnType<typeof createRipples>;
  const shown = () => [...layer.querySelectorAll<HTMLElement>('div')].map((element) => element.style.width);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    vi.stubGlobal('CSS', { supports: () => true });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: () => {},
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,');
    window.innerWidth = 800;
    window.innerHeight = 600;
    layer = document.createElement('div');
    ripples = createRipples(layer);
  });

  afterEach(() => {
    ripples.stop();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('ripples a click around its point, and ends', () => {
    ripples.at({ x: 300, y: 200 });
    expect(shown()).toEqual(['200px']);

    vi.advanceTimersByTime(800);
    expect(shown()).toEqual([]);
  });

  it('sends a clap across the whole screen, taking the click ripples running with it', () => {
    ripples.at({ x: 300, y: 200 });
    ripples.across({ x: 300, y: 200 });
    expect(shown()).toEqual(['800px']);
  });

  it('holds clicks and other claps back until the clap has crossed', () => {
    ripples.across({ x: 300, y: 200 });
    ripples.at({ x: 100, y: 100 });
    ripples.across({ x: 100, y: 100 });
    expect(shown()).toEqual(['800px']);

    vi.advanceTimersByTime(1200);
    ripples.at({ x: 100, y: 100 });
    expect(shown()).toEqual(['200px']);
  });
});
