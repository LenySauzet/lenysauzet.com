import { createPlacer, type Placement } from '@/lib/presence/anchors';
import {
  blurFor,
  Cadence,
  damp,
  lineAt,
  spring,
  tiltFor,
  Trail,
  type Spring,
  type Timed,
  type Vector,
} from '@/lib/presence/motion';
import type { Path } from '@/lib/presence/protocol';

const LAG = 28;
const SETTLE = 90;
const PRESSED_SCALE = 0.8;
const PRESS = { stiffness: 420, damping: 24 };
const LONGEST_PRESS = 4000;
const MOVING = 0.03;
const RESTING_OPACITY = 0.22;
const WAKING = 50;
const RESTING = 100;
const APPEARING = 70;
const CUT = 120;
export const GHOSTS = 4;
const SHUTTER = 56;
const GHOST_OPACITY = 0.45;
const FULL_SMEAR = 0.8;
const MOST_SHOWN = 10;
const LONGEST_FRAME = 64;
const AT_REST = 0.05;

interface Placed {
  anchor: string;
  placement: Placement;
}

type Signal = 'press' | 'release' | 'cut';

interface Remote {
  trail: Trail<Placed>;
  cadence: Cadence;
  signals: Timed<Signal>[];
  pressedAt?: number;
  shown?: Vector;
  history: Timed<Vector>[];
  velocity: Vector;
  tilt: number;
  scale: Spring;
  opacity: number;
  appear: number;
  drawn: { blur: string; opacity: string; ghosts: string[] };
}

interface Ink {
  main: HTMLElement;
  ghosts: HTMLElement[];
  blur: SVGFEGaussianBlurElement | null;
}

interface RemoteCursorsOptions {
  onChange: (ids: string[]) => void;
  onPress?: (id: string, point: Vector) => void;
  isStill: () => boolean;
}

const distance = (a: Vector, b: Vector) => Math.hypot(a.x - b.x, a.y - b.y);

export function createRemoteCursors({ onChange, onPress, isStill }: RemoteCursorsOptions) {
  const listening = new AbortController();
  const remotes = new Map<string, Remote>();
  const inks = new Map<string, Ink>();
  let published: string[] = [];
  let frame = 0;
  let drewAt = 0;
  let pressTimer = 0;

  const publish = () => {
    const shown = [...remotes.keys()].slice(0, MOST_SHOWN);
    if (shown.length === published.length && shown.every((id, index) => id === published[index])) return;
    published = shown;
    onChange(shown);
  };

  const wake = () => {
    if (!frame) frame = window.requestAnimationFrame(draw);
  };

  const fade = (element: HTMLElement, opacity: string, drawn: string) => {
    if (opacity !== drawn) element.style.opacity = opacity;
    return opacity;
  };

  const draw = (now: number) => {
    const elapsed = Math.min(LONGEST_FRAME, now - drewAt || 16);
    const still = isStill();
    const place = createPlacer();
    const resolve = ({ anchor, placement }: Placed) => place(anchor, placement);
    const scroll = { x: window.scrollX, y: window.scrollY };
    const presses: { id: string; point: Vector }[] = [];
    drewAt = now;

    const read = published.flatMap((id) => {
      const remote = remotes.get(id);
      const ink = inks.get(id);
      if (!remote || !ink) return [];
      const time = now - remote.cadence.delay;
      const target = remote.trail.at(time, resolve);
      let cut = false;
      for (let next = remote.signals[0]; next && next.at <= time; next = remote.signals[0]) {
        remote.signals.shift();
        if (next.value === 'cut') cut = true;
        else if (next.value === 'release') remote.pressedAt = undefined;
        else if (target) {
          remote.pressedAt = now;
          presses.push({ id, point: remote.shown ?? target });
        }
      }
      return target ? [{ id, remote, ink, time, target, cut }] : [];
    });

    let busy = false;
    let nextRelease = Infinity;

    for (const { remote, ink, time, target, cut } of read) {
      if (remote.pressedAt !== undefined && now - remote.pressedAt > LONGEST_PRESS) remote.pressedAt = undefined;
      const pressed = remote.pressedAt !== undefined;

      if (cut || !remote.shown) {
        remote.shown = target;
        remote.history = [];
        remote.velocity = { x: 0, y: 0 };
        remote.appear = cut ? 0 : 1;
        ink.main.style.visibility = 'visible';
      }

      const previous = remote.shown;
      const shown = { x: damp(previous.x, target.x, LAG, elapsed), y: damp(previous.y, target.y, LAG, elapsed) };
      remote.shown = shown;
      remote.velocity = {
        x: damp(remote.velocity.x, (shown.x - previous.x) / elapsed, SETTLE, elapsed),
        y: damp(remote.velocity.y, (shown.y - previous.y) / elapsed, SETTLE, elapsed),
      };
      remote.history = [...remote.history.filter(({ at }) => at > now - SHUTTER * 2), { at: now, value: shown }];

      const speed = Math.hypot(remote.velocity.x, remote.velocity.y);
      const moving = speed > MOVING || pressed;
      remote.tilt = still ? 0 : damp(remote.tilt, tiltFor(remote.velocity.x), SETTLE, elapsed);
      const scaleGoal = pressed ? PRESSED_SCALE : 1;
      remote.scale = still ? { value: scaleGoal, velocity: 0 } : spring(remote.scale, scaleGoal, elapsed, PRESS);
      const opacityGoal = moving ? 1 : RESTING_OPACITY;
      remote.opacity = damp(remote.opacity, opacityGoal, moving ? WAKING : RESTING, elapsed);
      remote.appear = damp(remote.appear, 1, APPEARING, elapsed);

      const pose = `rotate(${remote.tilt}deg) scale(${remote.scale.value})`;
      ink.main.style.transform = `translate3d(${shown.x - scroll.x}px, ${shown.y - scroll.y}px, 0) ${pose}`;
      const opacity = remote.opacity * remote.appear;
      remote.drawn.opacity = fade(ink.main, opacity.toFixed(3), remote.drawn.opacity);

      const smear = still ? 0 : Math.min(1, speed / FULL_SMEAR) * opacity;
      ink.ghosts.forEach((ghost, index) => {
        const order = index + 1;
        const past = lineAt(remote.history, now - (order * SHUTTER) / GHOSTS) ?? shown;
        const ghostOpacity = (GHOST_OPACITY * smear * (1 - order / (GHOSTS + 1))).toFixed(3);
        remote.drawn.ghosts[index] = fade(ghost, ghostOpacity, remote.drawn.ghosts[index] ?? '');
        if (ghostOpacity !== '0.000')
          ghost.style.transform = `translate3d(${past.x - scroll.x}px, ${past.y - scroll.y}px, 0) ${pose}`;
      });

      const blur = still ? '0 0' : `${blurFor(remote.velocity.x).toFixed(1)} ${blurFor(remote.velocity.y).toFixed(1)}`;
      if (blur !== remote.drawn.blur) {
        ink.blur?.setAttribute('stdDeviation', blur);
        remote.drawn.blur = blur;
      }

      if (remote.pressedAt !== undefined) nextRelease = Math.min(nextRelease, remote.pressedAt + LONGEST_PRESS - now);
      busy ||=
        distance(target, shown) > AT_REST ||
        speed > AT_REST / 100 ||
        Math.abs(remote.scale.value - scaleGoal) + Math.abs(remote.scale.velocity) > AT_REST / 10 ||
        Math.abs(remote.tilt) > AT_REST ||
        Math.abs(remote.opacity - opacityGoal) > AT_REST / 10 ||
        remote.appear < 1 - AT_REST / 10 ||
        remote.signals.length > 0 ||
        (remote.trail.latest?.at ?? 0) > time;
    }

    for (const { id, point } of presses) onPress?.(id, point);

    window.clearTimeout(pressTimer);
    if (busy) {
      frame = window.requestAnimationFrame(draw);
      return;
    }
    frame = 0;
    if (Number.isFinite(nextRelease)) pressTimer = window.setTimeout(wake, Math.max(0, nextRelease) + 1);
  };

  window.addEventListener('scroll', () => wake(), { passive: true, signal: listening.signal });
  window.addEventListener('resize', () => wake(), { passive: true, signal: listening.signal });

  const remoteOf = (id: string) => {
    let remote = remotes.get(id);
    if (!remote) {
      remote = {
        trail: new Trail(),
        cadence: new Cadence(),
        signals: [],
        history: [],
        velocity: { x: 0, y: 0 },
        tilt: 0,
        scale: { value: 1, velocity: 0 },
        opacity: 1,
        appear: 1,
        drawn: { blur: '', opacity: '', ghosts: [] },
      };
      remotes.set(id, remote);
      publish();
    }
    return remote;
  };

  const breaksAway = (remote: Remote, path: Path) => {
    const latest = remote.trail.latest?.value;
    const first = path.samples[0];
    if (!latest || !first || latest.anchor === path.anchor) return false;
    const place = createPlacer();
    const from = place(latest.anchor, latest.placement);
    const to = place(path.anchor, first);
    return Boolean(from && to && distance(from, to) > CUT);
  };

  const enqueue = (remote: Remote, signal: Timed<Signal>) => {
    const index = remote.signals.findIndex(({ at }) => at > signal.at);
    remote.signals.splice(index === -1 ? remote.signals.length : index, 0, signal);
  };

  const signal = (id: string, value: Signal) => {
    const remote = remotes.get(id);
    if (!remote || !published.includes(id)) return;
    enqueue(remote, { at: performance.now(), value });
    wake();
  };

  return {
    move(id: string, path: Path) {
      const now = performance.now();
      const remote = remoteOf(id);
      const oldest = path.samples[0]?.age ?? 0;
      remote.cadence.hear(now, oldest);
      if (breaksAway(remote, path)) {
        remote.trail.cut(now - oldest);
        enqueue(remote, { at: now - oldest, value: 'cut' });
      }
      for (const { age, ...placement } of path.samples)
        remote.trail.push({ at: now - age, value: { anchor: path.anchor, placement } });
      wake();
    },
    press: (id: string) => signal(id, 'press'),
    release: (id: string) => signal(id, 'release'),
    delayOf(id: string) {
      return remotes.get(id)?.cadence.delay ?? 0;
    },
    remove(id: string) {
      if (remotes.delete(id)) publish();
    },
    keepOnly(ids: Set<string>) {
      for (const id of remotes.keys()) if (!ids.has(id)) remotes.delete(id);
      publish();
    },
    attach(id: string, element: HTMLElement | null) {
      const main = element?.querySelector<HTMLElement>('[data-cursor-main]');
      if (element && main) {
        inks.set(id, {
          main,
          ghosts: [...element.querySelectorAll<HTMLElement>('[data-cursor-ghost]')],
          blur: element.querySelector('feGaussianBlur'),
        });
        wake();
      } else inks.delete(id);
    },
    stop() {
      listening.abort();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(pressTimer);
      remotes.clear();
      inks.clear();
    },
  };
}
