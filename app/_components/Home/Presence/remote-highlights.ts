import { rangeOf } from '@/lib/presence/anchors';
import { hueOf } from '@/lib/presence/hue';
import type { Span } from '@/lib/presence/protocol';

const nameOf = (id: string) => `presence-${id}`;

const ruleFor = (id: string) =>
  `::highlight(${nameOf(id)}) { background-color: oklch(var(--cursor-lightness) var(--cursor-chroma) ${hueOf(id)} / 0.3); }`;

export function createRemoteHighlights() {
  if (!('highlights' in CSS)) return { show() {}, hide() {}, keepOnly() {}, redraw() {}, stop() {} };

  const sheet = new CSSStyleSheet();
  const spans = new Map<string, Span>();
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

  const style = () => sheet.replaceSync([...spans.keys()].map(ruleFor).join('\n'));

  const draw = (id: string, span: Span) => {
    const range = rangeOf(span);
    if (range) CSS.highlights.set(nameOf(id), new Highlight(range));
    else CSS.highlights.delete(nameOf(id));
  };

  const show = (id: string, span: Span) => {
    const known = spans.has(id);
    spans.set(id, span);
    if (!known) style();
    draw(id, span);
  };

  const hide = (id: string) => {
    if (!spans.delete(id)) return;
    CSS.highlights.delete(nameOf(id));
    style();
  };

  return {
    show,
    hide,
    keepOnly(ids: Set<string>) {
      for (const id of spans.keys()) if (!ids.has(id)) hide(id);
    },
    redraw() {
      for (const [id, span] of spans) draw(id, span);
    },
    stop() {
      for (const id of spans.keys()) CSS.highlights.delete(nameOf(id));
      spans.clear();
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((adopted) => adopted !== sheet);
    },
  };
}
