import { clamp } from '@/lib/utils';

import type { Vector } from './motion';
import type { Sample } from './protocol';

const LONGEST_ANCHOR = 64;

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type Placement = Omit<Sample, 'age'>;

export interface Anchored {
  anchor: string;
  box: Box;
}

export const anchorFor = (kind: string, name?: string) =>
  (name
    ? `${kind}:${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`
    : kind
  ).slice(0, LONGEST_ANCHOR);

const closestOn = (box: Box, point: Vector): Vector => ({
  x: clamp(point.x, box.left, box.left + box.width),
  y: clamp(point.y, box.top, box.top + box.height),
});

export const distanceTo = (box: Box, point: Vector) => {
  const closest = closestOn(box, point);
  return Math.hypot(point.x - closest.x, point.y - closest.y);
};

export const placeOn = (box: Box, point: Vector): Placement => {
  const closest = closestOn(box, point);
  return {
    x: box.width ? (closest.x - box.left) / box.width : 0,
    y: box.height ? (closest.y - box.top) / box.height : 0,
    dx: Math.round(point.x - closest.x),
    dy: Math.round(point.y - closest.y),
  };
};

export const pointOn = (box: Box, { x, y, dx, dy }: Placement): Vector => ({
  x: box.left + x * box.width + dx,
  y: box.top + y * box.height + dy,
});

const area = ({ width, height }: Box) => width * height;

export function nearest<T extends Anchored>(candidates: T[], point: Vector): T | undefined {
  let best: { candidate: T; distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = distanceTo(candidate.box, point);
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && area(candidate.box) < area(best.candidate.box))
    )
      best = { candidate, distance };
  }
  return best?.candidate;
}
