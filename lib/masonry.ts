export interface Tile<T> {
  item: T;
  height: number;
}

export function distribute<T>(tiles: Tile<T>[], columns: number): T[][] {
  const lanes = Array.from({ length: columns }, () => ({ height: 0, items: [] as T[] }));

  for (const tile of tiles) {
    const shortest = lanes.reduce((low, lane) => (lane.height < low.height ? lane : low));
    shortest.items.push(tile.item);
    shortest.height += tile.height;
  }

  return lanes.map((lane) => lane.items);
}

export const WORK_ID = 'work';

export type Lane = 'first' | 'last';

export const laneOf = (index: number, count: number): Lane | undefined => {
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return undefined;
};
