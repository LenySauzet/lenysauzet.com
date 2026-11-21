export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const SAME_LINE = 0.5;
const TOUCHING = 2;

const sharedHeight = (a: Rect, b: Rect) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

export function linesOf(rects: Rect[]): Rect[] {
  const lines: Rect[] = [];
  const drawn = rects
    .filter(({ left, top, right, bottom }) => right > left && bottom > top)
    .sort((a, b) => a.top - b.top || a.left - b.left);

  for (const rect of drawn) {
    const line = lines.find(
      (candidate) =>
        sharedHeight(candidate, rect) >
          SAME_LINE * Math.min(candidate.bottom - candidate.top, rect.bottom - rect.top) &&
        rect.left <= candidate.right + TOUCHING &&
        rect.right >= candidate.left - TOUCHING
    );
    if (!line) {
      lines.push({ ...rect });
      continue;
    }
    line.left = Math.min(line.left, rect.left);
    line.top = Math.min(line.top, rect.top);
    line.right = Math.max(line.right, rect.right);
    line.bottom = Math.max(line.bottom, rect.bottom);
  }

  return lines;
}

export function trimEnds(lines: Rect[], start: { width: number; part: number }, end: { width: number; part: number }) {
  const first = lines[0];
  const last = lines.at(-1);
  if (!first || !last) return lines;
  return lines.map((line) => {
    const left = line === first ? Math.min(line.right, line.left + start.width * start.part) : line.left;
    const right = line === last ? Math.max(left, line.right - end.width * end.part) : line.right;
    return { ...line, left, right };
  });
}
