import { rangeOf } from '@/lib/presence/anchors';
import { hueOf } from '@/lib/presence/hue';
import { linesOf, trimEnds, type Rect } from '@/lib/presence/lines';
import { damp } from '@/lib/presence/motion';
import type { Span } from '@/lib/presence/protocol';
import { continues } from '@/lib/presence/spans';

const SWEEP = 70;
const FADE = 90;
const LONGEST_FRAME = 64;
const AT_REST = 0.01;
const LAYER = 'pointer-events-none absolute top-0 left-0 z-40 transition-opacity duration-200';
const LINE = 'absolute top-0 left-0 rounded-[3px]';

interface Mark {
  anchor: string;
  start: number;
  end: number;
  opacity: number;
  goal: { start: number; end: number; opacity: number };
  element: HTMLDivElement;
  lines: HTMLDivElement[];
}

interface Owner {
  current?: Mark;
  leaving: Mark[];
  colored: string;
}

const nameOf = (id: string) => `presence-${id}`;
const tintOf = (id: string, alpha: number) =>
  `oklch(var(--cursor-lightness) var(--cursor-chroma) ${hueOf(id)}${alpha < 1 ? ` / ${alpha}` : ''})`;
const ruleFor = (id: string) => `::highlight(${nameOf(id)}) { color: ${tintOf(id, 1)}; }`;

const widthOf = (anchor: string, index: number) =>
  index < 0 ? 0 : (rangeOf({ anchor, start: index, end: index + 1 })?.getBoundingClientRect().width ?? 0);

function linesFor({ anchor, start, end }: Mark): Rect[] {
  const from = Math.floor(start);
  const to = Math.ceil(end);
  const range = to > from ? rangeOf({ anchor, start: from, end: to }) : undefined;
  if (!range) return [];
  return trimEnds(
    linesOf([...range.getClientRects()].map(({ left, top, right, bottom }) => ({ left, top, right, bottom }))),
    { width: widthOf(anchor, from), part: start - from },
    { width: widthOf(anchor, to - 1), part: to - end }
  );
}

export function createRemoteHighlights(isStill: () => boolean) {
  if (!('highlights' in CSS)) return { show() {}, hide() {}, keepOnly() {}, cover() {}, stop() {} };

  const sheet = new CSSStyleSheet();
  const owners = new Map<string, Owner>();
  const layer = document.createElement('div');
  layer.className = LAYER;
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  let frame = 0;
  let drewAt = 0;
  let covered = false;

  const style = () => sheet.replaceSync(covered ? '' : [...owners.keys()].map(ruleFor).join('\n'));

  const wake = () => {
    if (!frame) frame = window.requestAnimationFrame(draw);
  };

  const resized = new ResizeObserver(wake);
  resized.observe(document.body);
  document.fonts.addEventListener('loadingdone', wake);

  const paint = (id: string, mark: Mark, lines: Rect[]) => {
    for (const extra of mark.lines.splice(lines.length)) extra.remove();
    while (mark.lines.length < lines.length) {
      const line = document.createElement('div');
      line.className = LINE;
      line.style.background = tintOf(id, 0.28);
      mark.element.append(line);
      mark.lines.push(line);
    }
    lines.forEach(({ left, top, right, bottom }, index) => {
      const line = mark.lines[index];
      if (!line) return;
      line.style.transform = `translate(${left + window.scrollX}px, ${top + window.scrollY}px)`;
      line.style.width = `${right - left}px`;
      line.style.height = `${bottom - top}px`;
    });
    mark.element.style.opacity = mark.opacity.toFixed(3);
  };

  const color = (id: string, owner: Owner) => {
    const mark = owner.current;
    const start = mark ? Math.round(mark.start) : 0;
    const end = mark ? Math.round(mark.end) : 0;
    const key = mark && end > start ? `${mark.anchor}:${start}:${end}` : '';
    if (key === owner.colored) return;
    owner.colored = key;
    const range = mark && key ? rangeOf({ anchor: mark.anchor, start, end }) : undefined;
    if (range) CSS.highlights.set(nameOf(id), new Highlight(range));
    else CSS.highlights.delete(nameOf(id));
  };

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

  const draw = (now: number) => {
    const elapsed = Math.min(LONGEST_FRAME, now - drewAt || 16);
    const still = isStill();
    drewAt = now;
    let busy = false;

    const measured = [...owners].flatMap(([id, owner]) =>
      (owner.current ? [owner.current, ...owner.leaving] : owner.leaving).map((mark) => {
        step(mark, elapsed, still);
        busy ||= !settled(mark);
        return { id, mark, lines: linesFor(mark) };
      })
    );
    for (const { id, mark, lines } of measured) paint(id, mark, lines);

    for (const [id, owner] of owners) {
      owner.leaving = owner.leaving.filter((mark) => {
        if (mark.opacity > AT_REST) return true;
        mark.element.remove();
        return false;
      });
      color(id, owner);
      if (!owner.current && !owner.leaving.length) {
        owners.delete(id);
        style();
      }
    }

    frame = busy ? window.requestAnimationFrame(draw) : 0;
  };

  const leave = (owner: Owner) => {
    const mark = owner.current;
    if (!mark) return;
    mark.goal = { start: mark.goal.start, end: mark.goal.start, opacity: 0 };
    owner.leaving.push(mark);
    owner.current = undefined;
  };

  const show = (id: string, span: Span) => {
    let owner = owners.get(id);
    if (!owner) {
      owner = { leaving: [], colored: '' };
      owners.set(id, owner);
      style();
    }
    const { current } = owner;
    if (current && continues({ anchor: current.anchor, start: current.goal.start, end: current.goal.end }, span)) {
      current.goal = { start: span.start, end: span.end, opacity: 1 };
    } else {
      leave(owner);
      const element = document.createElement('div');
      layer.append(element);
      owner.current = {
        anchor: span.anchor,
        start: span.start,
        end: span.start,
        opacity: 1,
        goal: { start: span.start, end: span.end, opacity: 1 },
        element,
        lines: [],
      };
    }
    wake();
  };

  const hide = (id: string) => {
    const owner = owners.get(id);
    if (!owner) return;
    leave(owner);
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
      window.cancelAnimationFrame(frame);
      resized.disconnect();
      document.fonts.removeEventListener('loadingdone', wake);
      for (const id of owners.keys()) CSS.highlights.delete(nameOf(id));
      owners.clear();
      layer.remove();
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((adopted) => adopted !== sheet);
    },
  };
}
