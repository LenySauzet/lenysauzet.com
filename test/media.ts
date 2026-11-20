const preferences = { reducedMotion: true };

export const prefersReducedMotion = (reduced: boolean) => {
  preferences.reducedMotion = reduced;
};

export const matchMedia = (query: string) =>
  ({
    matches: /prefers-reduced-motion/.test(query) && preferences.reducedMotion,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

export const resetMedia = () => prefersReducedMotion(true);
