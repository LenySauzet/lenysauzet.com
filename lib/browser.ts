const ENGINES: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chromium'],
  [/Safari\//, 'Safari'],
];

export const browserName = (userAgent: string) =>
  ENGINES.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Unknown';
