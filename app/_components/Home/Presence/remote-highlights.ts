import { createRangeReader } from '@/lib/presence/anchors';
import { inkOf, tintOf } from '@/lib/presence/hue';
import { linesOf, trimEnds, type Rect } from '@/lib/presence/lines';
import { damp } from '@/lib/presence/motion';
import type { Marks, Span } from '@/lib/presence/protocol';
import { planMarks } from '@/lib/presence/selection';

const SWEEP = 45;
const FADE = 90;
const LONGEST_FRAME = 64;
const AT_REST = 0.01;
const TINT = 0.28;
const LAYER = 'pointer-events-none absolute top-0 left-0 z-30 transition-opacity duration-200';
const LINE = 'absolute top-0 left-0 rounded-[3px]';

interface Mark {
  anchor: string;
  start: number;
  end: number;
  opacity: number;
  goal: { start: number; end: number; opacity: number };
  backward: boolean;
  element: HTMLDivElement;
  lines: HTMLDivElement[];
}

interface Owner {
  current: Map<string, Mark>;
  leaving: Mark[];
  colored: string;
}

type ReadRange = ReturnType<typeof createRangeReader>;

const nameOf = (id: string) => `presence-${id}`;
const ruleFor = (id: string) => `::highlight(${nameOf(id)}) { color: ${inkOf(id)}; }`;
const goalOf = ({ anchor, goal }: Mark): Span => ({ anchor, start: goal.start, end: goal.end });

function textRects(range: Range): Rect[] {
  const root = range.commonAncestorContainer;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const rects: Rect[] = [];
  for (let node = root.nodeType === Node.TEXT_NODE ? root : walker.nextNode(); node; node = walker.nextNode()) {
    if (!range.intersectsNode(node)) continue;
    const piece = document.createRange();
    piece.selectNodeContents(node);
    if (node === range.startContainer) piece.setStart(node, range.startOffset);
    if (node === range.endContainer) piece.setEnd(node, range.endOffset);
    for (const { left, top, right, bottom } of piece.getClientRects()) rects.push({ left, top, right, bottom });
  }
  return rects;
}

function linesFor({ anchor, start, end }: Mark, read: ReadRange): Rect[] {
  const from = Math.floor(start);
  const to = Math.ceil(end);
  const range = to > from ? read({ anchor, start: from, end: to }) : undefined;
  if (!range) return [];
  const widthAt = (index: number) => read({ anchor, start: index, end: index + 1 })?.getBoundingClientRect().width ?? 0;
  return trimEnds(
    linesOf(textRects(range)),
    { width: widthAt(from), part: start - from },
    { width: widthAt(to - 1), part: to - end }
  );
}

function coloredSpans(owner: Owner) {
  return [...owner.current.values()].flatMap(({ anchor, start, end }) => {
    const from = Math.round(start);
    const to = Math.round(end);
    return to > from ? [{ anchor, start: from, end: to }] : [];
  });
}

export function createRemoteHighlights(reducedMotion: () => boolean) {
  const colors = 'highlights' in CSS;
  const sheet = new CSSStyleSheet();
  const owners = new Map<string, Owner>();
  const layer = document.createElement('div');
  layer.className = LAYER;
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  if (colors) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  let rafId = 0;
  let drewAt = 0;
  let covered = false;

  const style = () => {
    if (colors) sheet.replaceSync(covered ? '' : [...owners.keys()].map(ruleFor).join('\n'));
  };

  const wake = () => {
    if (!rafId && owners.size) rafId = window.requestAnimationFrame(draw);
  };

  const resized = new ResizeObserver(wake);
  resized.observe(document.body);
  document.fonts.addEventListener('loadingdone', wake);

  const settled = (mark: Mark) =>
    Math.abs(mark.start - mark.goal.start) < AT_REST &&
    Math.abs(mark.end - mark.goal.end) < AT_REST &&
    Math.abs(mark.opacity - mark.goal.opacity) < AT_REST;

  const step = (mark: Mark, elapsed: number, still: boolean) => {
    if (still || settled(mark)) {
      Object.assign(mark, mark.goal);
      return;
    }
    mark.start = damp(mark.start, mark.goal.start, SWEEP, elapsed);
    mark.end = damp(mark.end, mark.goal.end, SWEEP, elapsed);
    mark.opacity = damp(mark.opacity, mark.goal.opacity, FADE, elapsed);
  };

  const paint = (id: string, mark: Mark, lines: Rect[], scroll: { x: number; y: number }) => {
    for (const extra of mark.lines.splice(lines.length)) extra.remove();
    while (mark.lines.length < lines.length) {
      const line = document.createElement('div');
      line.className = LINE;
      line.style.background = tintOf(id, TINT);
      mark.element.append(line);
      mark.lines.push(line);
    }
    lines.forEach(({ left, top, right, bottom }, index) => {
      const line = mark.lines[index];
      if (!line) return;
      line.style.transform = `translate(${left + scroll.x}px, ${top + scroll.y}px)`;
      line.style.width = `${right - left}px`;
      line.style.height = `${bottom - top}px`;
    });
    mark.element.style.opacity = mark.opacity.toFixed(3);
  };

  const draw = (now: number) => {
    rafId = 0;
    const elapsed = Math.min(LONGEST_FRAME, now - drewAt || 16);
    const still = reducedMotion();
    const read = createRangeReader();
    const scroll = { x: window.scrollX, y: window.scrollY };
    drewAt = now;
    let busy = false;

    const marks = [...owners].flatMap(([id, owner]) =>
      [...owner.current.values(), ...owner.leaving].map((mark) => {
        step(mark, elapsed, still);
        busy ||= !settled(mark);
        return { id, mark, lines: linesFor(mark, read) };
      })
    );
    const colorings = [...owners].flatMap(([id, owner]) => {
      if (!colors) return [];
      const spans = coloredSpans(owner);
      const key = spans.map(({ anchor, start, end }) => `${anchor}:${start}:${end}`).join(' ');
      if (key === owner.colored) return [];
      owner.colored = key;
      return [{ id, ranges: spans.flatMap((span) => read(span) ?? []) }];
    });

    for (const { id, mark, lines } of marks) paint(id, mark, lines, scroll);
    for (const { id, ranges } of colorings) {
      if (ranges.length) CSS.highlights.set(nameOf(id), new Highlight(...ranges));
      else CSS.highlights.delete(nameOf(id));
    }
    for (const [id, owner] of owners) {
      owner.leaving = owner.leaving.filter((mark) => {
        if (mark.opacity > AT_REST) return true;
        mark.element.remove();
        return false;
      });
      if (!owner.current.size && !owner.leaving.length) {
        owners.delete(id);
        if (colors) CSS.highlights.delete(nameOf(id));
        style();
      }
    }

    if (busy) wake();
  };

  const fold = (owner: Owner, mark: Mark) => {
    const origin = mark.backward ? mark.goal.end : mark.goal.start;
    mark.goal = { start: origin, end: origin, opacity: 0 };
    owner.leaving.push(mark);
    owner.current.delete(mark.anchor);
  };

  const begin = (span: Span, backward: boolean): Mark => {
    const element = document.createElement('div');
    layer.append(element);
    const origin = backward ? span.end : span.start;
    return {
      anchor: span.anchor,
      start: origin,
      end: origin,
      opacity: 1,
      goal: { start: span.start, end: span.end, opacity: 1 },
      backward,
      element,
      lines: [],
    };
  };

  const show = (id: string, { spans, backward }: Marks) => {
    const reversed = backward === true;
    let owner = owners.get(id);
    if (!owner) {
      owner = { current: new Map(), leaving: [], colored: '' };
      owners.set(id, owner);
      style();
    }
    const plan = planMarks([...owner.current.values()].map(goalOf), spans);
    for (const anchor of plan.fold) {
      const mark = owner.current.get(anchor);
      if (mark) fold(owner, mark);
    }
    for (const span of plan.carry) {
      const mark = owner.current.get(span.anchor);
      if (!mark) continue;
      mark.goal = { start: span.start, end: span.end, opacity: 1 };
      mark.backward = reversed;
    }
    for (const span of plan.begin) owner.current.set(span.anchor, begin(span, reversed));
    wake();
  };

  const hide = (id: string) => {
    const owner = owners.get(id);
    if (!owner) return;
    for (const mark of [...owner.current.values()]) fold(owner, mark);
    wake();
  };

  return {
    show,
    hide,
    keepOnly(ids: Set<string>) {
      for (const id of owners.keys()) if (!ids.has(id)) hide(id);
    },
    cover(next: boolean) {
      covered = next;
      layer.style.opacity = covered ? '0' : '';
      style();
    },
    stop() {
      window.cancelAnimationFrame(rafId);
      resized.disconnect();
      document.fonts.removeEventListener('loadingdone', wake);
      if (colors) for (const id of owners.keys()) CSS.highlights.delete(nameOf(id));
      owners.clear();
      layer.remove();
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((adopted) => adopted !== sheet);
    },
  };
}

export type RemoteHighlights = ReturnType<typeof createRemoteHighlights>;
