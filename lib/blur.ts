export interface BlurLayer {
  radius: number;
  from: number;
  to: number;
}

const STEEPNESS = 4;

const strengthAt = (strongest: number, at: number) => (strongest * (2 ** (STEEPNESS * at) - 1)) / (2 ** STEEPNESS - 1);

export function blurLayers(count: number, strongest: number): BlurLayer[] {
  return Array.from({ length: count }, (_, index) => {
    const from = index / count;
    const to = (index + 1) / count;
    const before = strengthAt(strongest, from);
    const after = strengthAt(strongest, to);
    return { radius: Math.sqrt(after ** 2 - before ** 2), from, to };
  });
}

export const reachFor = (left: number, band: number) => (left < 1 || band <= 0 ? 0 : Math.min(1, left / band));
