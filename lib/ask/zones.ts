export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  top: number;
  left: number;
  right: number;
}

export const WAKE_HEIGHT = 24;
export const WAKE_HALF_WIDTH = 140;
export const STAY_REACH = 64;

export const wakes = (pointer: Point, bar: Bounds) =>
  pointer.y >= bar.top - WAKE_HEIGHT && Math.abs(pointer.x - (bar.left + bar.right) / 2) <= WAKE_HALF_WIDTH;

export const stays = (pointer: Point, bar: Bounds) =>
  pointer.y >= bar.top - STAY_REACH && pointer.x >= bar.left - STAY_REACH && pointer.x <= bar.right + STAY_REACH;

export const near = (pointer: Point, bar: Bounds, already: boolean) =>
  already ? stays(pointer, bar) : wakes(pointer, bar);

export const across = (pointer: Point, bar: Bounds) =>
  Math.min(96, Math.max(4, ((pointer.x - bar.left) / (bar.right - bar.left)) * 100));
