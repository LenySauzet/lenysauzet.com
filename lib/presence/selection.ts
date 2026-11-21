import type { Span } from './protocol';

export const continues = (previous: Span, next: Span) =>
  previous.anchor === next.anchor && (previous.start === next.start || previous.end === next.end);

export interface MarkPlan {
  carry: Span[];
  fold: string[];
  begin: Span[];
}

export function planMarks(shown: Span[], next: Span[]): MarkPlan {
  const carry = next.filter((span) => shown.some((mark) => continues(mark, span)));
  const carried = new Set(carry.map(({ anchor }) => anchor));
  return {
    carry,
    fold: shown.filter(({ anchor }) => !carried.has(anchor)).map(({ anchor }) => anchor),
    begin: next.filter(({ anchor }) => !carried.has(anchor)),
  };
}
