import type { Layout } from './protocol';

const TWO_COLUMNS = '(min-width: 48rem)';
const THREE_COLUMNS = '(min-width: 64rem)';

export const LAYOUT_QUERIES = [TWO_COLUMNS, THREE_COLUMNS];

export const layoutNow = (): Layout =>
  window.matchMedia(THREE_COLUMNS).matches ? 3 : window.matchMedia(TWO_COLUMNS).matches ? 2 : 1;
