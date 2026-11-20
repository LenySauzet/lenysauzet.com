import type { Vector } from '@/lib/presence/motion';

const SVG = 'http://www.w3.org/2000/svg';
const DURATION = 700;
const REACH = 140;
const STRENGTH = 34;
const CHANNELS = [
  { spread: 1.3, keep: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { spread: 1, keep: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { spread: 0.7, keep: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
];
const MAP_SIZE = 256;
const BLEED = 48;
const RING_FROM = 0.5;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

let wave: string | undefined;

function waveMap() {
  if (wave) return wave;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MAP_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  const image = context.createImageData(MAP_SIZE, MAP_SIZE);
  const middle = MAP_SIZE / 2;
  for (let y = 0; y < MAP_SIZE; y += 1) {
    for (let x = 0; x < MAP_SIZE; x += 1) {
      const dx = (x + 0.5 - middle) / middle;
      const dy = (y + 0.5 - middle) / middle;
      const distance = Math.hypot(dx, dy);
      const ring = distance > RING_FROM && distance < 1 ? Math.sin((Math.PI * (distance - RING_FROM)) / (1 - RING_FROM)) : 0;
      const index = (y * MAP_SIZE + x) * 4;
      image.data[index] = 128 + 127 * (distance ? dx / distance : 0) * ring;
      image.data[index + 1] = 128 + 127 * (distance ? dy / distance : 0) * ring;
      image.data[index + 2] = 128;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  wave = canvas.toDataURL();
  return wave;
}

const create = <K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number>) => {
  const element = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
};

export function createRipples() {
  const defs = create('svg', { width: 0, height: 0, 'aria-hidden': 'true' });
  defs.style.position = 'absolute';
  document.body.append(defs);
  const running = new Map<HTMLElement, () => void>();
  let count = 0;

  const ripple = (element: HTMLElement, center: Vector, size: { width: number; height: number }) => {
    const map = waveMap();
    if (!map) return;
    running.get(element)?.();

    const id = `presence-ripple-${(count += 1)}`;
    const filter = create('filter', {
      id,
      filterUnits: 'userSpaceOnUse',
      x: -BLEED,
      y: -BLEED,
      width: size.width + BLEED * 2,
      height: size.height + BLEED * 2,
      'color-interpolation-filters': 'sRGB',
      primitiveUnits: 'userSpaceOnUse',
    });
    const image = create('feImage', { href: map, preserveAspectRatio: 'none', result: 'wave' });
    const displacements = CHANNELS.map((_, index) =>
      create('feDisplacementMap', {
        in: 'SourceGraphic',
        in2: 'map',
        scale: 0,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: `shifted-${index}`,
      })
    );
    filter.append(
      create('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'still' }),
      image,
      create('feComposite', { in: 'wave', in2: 'still', operator: 'over', result: 'map' }),
      ...displacements,
      ...CHANNELS.map(({ keep }, index) =>
        create('feColorMatrix', { in: `shifted-${index}`, type: 'matrix', values: keep, result: `channel-${index}` })
      ),
      create('feBlend', { in: 'channel-0', in2: 'channel-1', mode: 'screen', result: 'mixed' }),
      create('feBlend', { in: 'mixed', in2: 'channel-2', mode: 'screen' })
    );
    defs.append(filter);

    const before = element.style.filter;
    element.style.filter = `url(#${id})`;
    const startedAt = performance.now();
    let frame = 0;

    const end = () => {
      window.cancelAnimationFrame(frame);
      element.style.filter = before;
      filter.remove();
      running.delete(element);
    };

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / DURATION);
      const radius = Math.max(1, REACH * easeOutCubic(t));
      image.setAttribute('x', String(center.x - radius));
      image.setAttribute('y', String(center.y - radius));
      image.setAttribute('width', String(radius * 2));
      image.setAttribute('height', String(radius * 2));
      const strength = STRENGTH * (1 - t) ** 2;
      displacements.forEach((displacement, index) =>
        displacement.setAttribute('scale', String(strength * (CHANNELS[index]?.spread ?? 1)))
      );
      if (t < 1) frame = window.requestAnimationFrame(step);
      else end();
    };

    running.set(element, end);
    frame = window.requestAnimationFrame(step);
  };

  return {
    at(point: Vector) {
      const client = { x: point.x - window.scrollX, y: point.y - window.scrollY };
      const target = document.elementFromPoint(client.x, client.y)?.closest<HTMLElement>('[data-presence]');
      if (!target) return;
      const box = target.getBoundingClientRect();
      ripple(target, { x: client.x - box.left, y: client.y - box.top }, box);
    },
    stop() {
      for (const end of [...running.values()]) end();
      defs.remove();
    },
  };
}
