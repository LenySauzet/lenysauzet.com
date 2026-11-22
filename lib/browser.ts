const BROWSERS: [RegExp, string][] = [
  [/Edg(iOS|A)?\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/(Firefox|FxiOS)\//, 'Firefox'],
  [/(Chrome|CriOS)\//, 'Chromium'],
  [/Safari\//, 'Safari'],
];

export const browserName = (userAgent: string) =>
  BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Unknown';

export const FINE_POINTER = '(pointer: fine)';

export const hasFinePointer = () => window.matchMedia(FINE_POINTER).matches;

export const unchanging = () => () => {};

export const goTo = (path: string) => window.location.assign(path);
