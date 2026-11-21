import { describe, expect, it } from 'vitest';

import { blurLayers, reachFor } from './blur';

describe('blurLayers', () => {
  const layers = blurLayers(6, 12);

  it('stacks to the strongest blur at the edge, as blurs add in quadrature', () => {
    const total = Math.sqrt(layers.reduce((sum, { radius }) => sum + radius ** 2, 0));

    expect(total).toBeCloseTo(12);
  });

  it('grows exponentially, so the content eases into the blur', () => {
    const radii = layers.map(({ radius }) => radius);

    expect(radii.every((radius, index) => index === 0 || radius > (radii[index - 1] ?? Infinity))).toBe(true);
    expect(radii[0]).toBeLessThan(1);
  });

  it('tiles the band with no gap', () => {
    expect(layers[0]?.from).toBe(0);
    expect(layers.at(-1)?.to).toBe(1);
    expect(layers.every((layer, index) => index === 0 || layer.from === layers[index - 1]?.to)).toBe(true);
  });
});

describe('reachFor', () => {
  it('is whole away from the end, shrinks over the last band, and is gone at the last pixel', () => {
    expect(reachFor(500, 96)).toBe(1);
    expect(reachFor(48, 96)).toBe(0.5);
    expect(reachFor(0.4, 96)).toBe(0);
    expect(reachFor(0, 96)).toBe(0);
  });
});
