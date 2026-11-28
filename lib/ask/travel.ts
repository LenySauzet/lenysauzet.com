export const TURN_AFTER = 12;

export interface Travel {
  y: number;
  distance: number;
  rising: boolean;
}

export const startAt = (y: number): Travel => ({ y, distance: 0, rising: false });

export function travel(previous: Travel, y: number): Travel {
  const delta = y - previous.y;
  if (delta === 0) return previous;
  const distance = Math.sign(delta) === Math.sign(previous.distance) ? previous.distance + delta : delta;
  const rising = distance <= -TURN_AFTER ? true : distance >= TURN_AFTER ? false : previous.rising;
  return { y, distance, rising };
}
