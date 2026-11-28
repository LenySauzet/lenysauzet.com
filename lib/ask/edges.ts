export interface Edges {
  start: boolean;
  end: boolean;
}

export const edgesOf = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: Pick<Element, 'scrollLeft' | 'scrollWidth' | 'clientWidth'>): Edges => ({
  start: scrollLeft > 1,
  end: scrollLeft < scrollWidth - clientWidth - 1,
});
