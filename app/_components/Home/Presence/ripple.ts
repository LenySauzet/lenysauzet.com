import type { Vector } from '@/lib/presence/motion';

const SVG = 'http://www.w3.org/2000/svg';
const DURATION = 700;
const REACH = 100;
const SIZE = REACH * 2;
const STRENGTH = 30;
const CHANNELS = [
  { spread: 1.3, keep: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { spread: 1, keep: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { spread: 0.7, keep: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
];
const MAP_SIZE = 256;
const RING_FROM = 0.5;
const MOST_AT_ONCE = 3;
const PLACED = 'pointer-events-none absolute';

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
      const ring =
        distance > RING_FROM && distance < 1 ? Math.sin((Math.PI * (distance - RING_FROM)) / (1 - RING_FROM)) : 0;
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

const isWebKit = () => 'GestureEvent' in window;
const distorts = () => CSS.supports('backdrop-filter', 'url(#ripple)') && !isWebKit();

export function createRipples(layer: HTMLElement) {
  const defs = create('svg', { width: 0, height: 0, 'aria-hidden': 'true' });
  defs.style.position = 'absolute';
  layer.append(defs);
  const running = new Set<() => void>();
  const makeRoom = () => {
    const [oldest] = running;
    if (running.size >= MOST_AT_ONCE && oldest) oldest();
  };
  let count = 0;

  const place = (center: Vector) => {
    const element = document.createElement('div');
    element.className = PLACED;
    Object.assign(element.style, {
      left: `${center.x - REACH}px`,
      top: `${center.y - REACH}px`,
      width: `${SIZE}px`,
      height: `${SIZE}px`,
    });
    layer.append(element);
    return element;
  };

  const distort = (center: Vector, map: string) => {
    const id = `presence-ripple-${(count += 1)}`;
    const filter = create('filter', {
      id,
      x: 0,
      y: 0,
      width: SIZE,
      height: SIZE,
      filterUnits: 'userSpaceOnUse',
      primitiveUnits: 'userSpaceOnUse',
      'color-interpolation-filters': 'sRGB',
    });
    const image = create('feImage', { href: map, preserveAspectRatio: 'none', result: 'wave' });
    const displacements = CHANNELS.map(({ spread }, index) => ({
      spread,
      node: create('feDisplacementMap', {
        in: 'SourceGraphic',
        in2: 'map',
        scale: 0,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: `shifted-${index}`,
      }),
    }));
    filter.append(
      create('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'still' }),
      image,
      create('feComposite', { in: 'wave', in2: 'still', operator: 'over', result: 'map' }),
      ...displacements.map(({ node }) => node),
      ...CHANNELS.map(({ keep }, index) =>
        create('feColorMatrix', { in: `shifted-${index}`, type: 'matrix', values: keep, result: `channel-${index}` })
      ),
      create('feBlend', { in: 'channel-0', in2: 'channel-1', mode: 'screen', result: 'mixed' }),
      create('feBlend', { in: 'mixed', in2: 'channel-2', mode: 'screen' })
    );
    defs.append(filter);

    const element = place(center);
    element.style.backdropFilter = `url(#${id})`;
    const startedAt = performance.now();
    let rafId = 0;

    const end = () => {
      window.cancelAnimationFrame(rafId);
      element.remove();
      filter.remove();
      running.delete(end);
    };

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / DURATION);
      const radius = Math.max(1, REACH * easeOutCubic(t));
      image.setAttribute('x', String(REACH - radius));
      image.setAttribute('y', String(REACH - radius));
      image.setAttribute('width', String(radius * 2));
      image.setAttribute('height', String(radius * 2));
      const strength = STRENGTH * (1 - t) ** 2;
      for (const { node, spread } of displacements) node.setAttribute('scale', String(strength * spread));
      if (t < 1) rafId = window.requestAnimationFrame(step);
      else end();
    };

    running.add(end);
    rafId = window.requestAnimationFrame(step);
  };

  return {
    at(client: Vector) {
      const map = distorts() ? waveMap() : undefined;
      if (!map) return;
      makeRoom();
      distort(client, map);
    },
    stop() {
      for (const end of [...running]) end();
      defs.remove();
    },
  };
}
