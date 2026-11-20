const SEED = 31;

export const hueOf = (id: string) => [...id].reduce((hash, character) => (hash * SEED + character.charCodeAt(0)) % 360, 0);
