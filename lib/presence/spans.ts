import type { Span } from './protocol';

export const continues = (previous: Span, next: Span) =>
  previous.anchor === next.anchor && (previous.start === next.start || previous.end === next.end);
