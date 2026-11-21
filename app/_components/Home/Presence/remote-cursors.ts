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
import type { Detail, Path } from '@/lib/presence/protocol';

const LAG = 28;
const SETTLE = 90;
const PRESSED_SCALE = 0.8;
const PRESS = { stiffness: 420, damping: 24 };
const LONGEST_PRESS = 4000;
const MOVING = 0.03;
const RESTING_AFTER = 1000;
const RESTING_OPACITY = 0.22;
const WAKING = 50;
const RESTING = 180;
export const GHOSTS = 4;
const SHUTTER = 56;
const GHOST_OPACITY = 0.45;
const FULL_SMEAR = 0.8;
const MOST_SHOWN = 10;
const LONGEST_FRAME = 64;
const AT_REST = 0.05;
const PRECISE_BELOW = 0.45;
const CORRECTING = 110;

interface Placed {
  anchor: string;
  placement: Placement;
}

interface Precision {
  anchor: string;
  detail: Detail;
  placement: Placement;
}

type Signal = 'press' | 'release' | 'click' | 'leave';

interface Remote {
  trail: Trail<Placed>;
  cadence: Cadence;
  signals: Timed<Signal>[];
  precisions: Timed<Precision | undefined>[];
  correction: Vector;
  followed?: Vector;
  pace: number;
  pressed?: Timed<Vector>;
  pressedAt?: Vector;
  shown?: Vector;
  movedAt: number;
  history: Timed<Vector>[];
  velocity: Vector;
  tilt: number;
  scale: Spring;
  opacity: number;
  drawn: { blur: string; opacity: string; ghosts: string[] };
}

interface Ink {
  main: HTMLElement;
  ghosts: HTMLElement[];
  blur: SVGFEGaussianBlurElement | null;
}

interface RemoteCursorsOptions {
  onChange: (ids: string[]) => void;
  onClick?: (id: string, point: Vector) => void;
  isStill: () => boolean;
}

const distance = (a: Vector, b: Vector) => Math.hypot(a.x - b.x, a.y - b.y);

export function createRemoteCursors({ onChange, onClick, isStill }: RemoteCursorsOptions) {
  const listening = new AbortController();
  const remotes = new Map<string, Remote>();
  const inks = new Map<string, Ink>();
  let published: string[] = [];
  let frame = 0;
  let drewAt = 0;
  let timer = 0;

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
    const resolve = ({ anchor, placement }: Placed) => place({ anchor, part: '' }, placement);
    const offsetOf = (precision: Precision | undefined): Vector => {
      if (!precision) return { x: 0, y: 0 };
      const { anchor, detail, placement } = precision;
      const precise = place({ anchor, part: detail.part }, { x: detail.x, y: detail.y, dx: 0, dy: 0 });
      const coarse = place({ anchor, part: '' }, placement);
      return precise && coarse ? { x: precise.x - coarse.x, y: precise.y - coarse.y } : { x: 0, y: 0 };
    };
    const scroll = { x: window.scrollX, y: window.scrollY };
    const clicks: { id: string; point: Vector }[] = [];
    const departed: string[] = [];
    drewAt = now;

    const read = published.flatMap((id) => {
      const remote = remotes.get(id);
      const ink = inks.get(id);
      if (!remote || !ink) return [];
      const time = now - remote.cadence.delay;
      const path = remote.trail.at(time, resolve);
      while (remote.precisions.length > 1 && (remote.precisions[1]?.at ?? Infinity) <= time) remote.precisions.shift();
      const due = remote.precisions[0];
      const offset = due && due.at <= time ? offsetOf(due.value) : { x: 0, y: 0 };
      const travelled = path && remote.followed ? Math.hypot(path.x - remote.followed.x, path.y - remote.followed.y) : 0;
      remote.followed = path;
      remote.pace = damp(remote.pace, travelled / elapsed, SETTLE, elapsed);
      const weight = still ? 1 : Math.max(0, 1 - remote.pace / PRECISE_BELOW);
      const aim = { x: offset.x * weight, y: offset.y * weight };
      remote.correction = {
        x: damp(remote.correction.x, aim.x, CORRECTING, elapsed),
        y: damp(remote.correction.y, aim.y, CORRECTING, elapsed),
      };
      const target = path && { x: path.x + remote.correction.x, y: path.y + remote.correction.y };
      for (let next = remote.signals[0]; next && next.at <= time; next = remote.signals[0]) {
        remote.signals.shift();
        const point = remote.shown ?? target;
        if (next.value === 'leave') departed.push(id);
        else if (next.value === 'press') {
          remote.pressed = point && { at: now, value: point };
          remote.pressedAt = point;
        } else if (next.value === 'release') remote.pressed = undefined;
        else {
          const at = remote.pressedAt ?? point;
          if (at) clicks.push({ id, point: at });
        }
      }
      return target ? [{ remote, ink, time, target, aim }] : [];
    });

    let busy = false;
    let nextTimer = Infinity;

    for (const { remote, ink, time, target, aim } of read) {
      if (remote.pressed && now - remote.pressed.at > LONGEST_PRESS) remote.pressed = undefined;
      const pressed = remote.pressed !== undefined;

      if (!remote.shown) {
        remote.shown = target;
        remote.movedAt = now;
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
      if (speed > MOVING || pressed) remote.movedAt = now;
      const awake = now - remote.movedAt < RESTING_AFTER;
      remote.tilt = still ? 0 : damp(remote.tilt, tiltFor(remote.velocity), SETTLE, elapsed);
      const scaleGoal = pressed ? PRESSED_SCALE : 1;
      remote.scale = still ? { value: scaleGoal, velocity: 0 } : spring(remote.scale, scaleGoal, elapsed, PRESS);
      const opacityGoal = awake ? 1 : RESTING_OPACITY;
      remote.opacity = damp(remote.opacity, opacityGoal, awake ? WAKING : RESTING, elapsed);

      const pose = `rotate(${remote.tilt}deg) scale(${remote.scale.value})`;
      ink.main.style.transform = `translate3d(${shown.x - scroll.x}px, ${shown.y - scroll.y}px, 0) ${pose}`;
      remote.drawn.opacity = fade(ink.main, remote.opacity.toFixed(3), remote.drawn.opacity);

      const smear = still ? 0 : Math.min(1, speed / FULL_SMEAR) * remote.opacity;
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

      if (awake) nextTimer = Math.min(nextTimer, remote.movedAt + RESTING_AFTER - now);
      if (remote.pressed) nextTimer = Math.min(nextTimer, remote.pressed.at + LONGEST_PRESS - now);
      busy ||=
        distance(target, shown) > AT_REST ||
        speed > AT_REST / 100 ||
        remote.pace > AT_REST / 100 ||
        Math.abs(remote.scale.value - scaleGoal) + Math.abs(remote.scale.velocity) > AT_REST / 10 ||
        Math.abs(remote.tilt) > AT_REST ||
        Math.abs(remote.opacity - opacityGoal) > AT_REST / 10 ||
        Math.hypot(remote.correction.x - aim.x, remote.correction.y - aim.y) > AT_REST ||
        remote.signals.length > 0 ||
        (remote.trail.latest?.at ?? 0) > time;
    }

    for (const { id, point } of clicks) onClick?.(id, point);
    if (departed.length) {
      for (const id of departed) remotes.delete(id);
      publish();
    }

    window.clearTimeout(timer);
    if (busy) {
      frame = window.requestAnimationFrame(draw);
      return;
    }
    frame = 0;
    if (Number.isFinite(nextTimer)) timer = window.setTimeout(wake, Math.max(0, nextTimer) + 1);
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
        precisions: [],
        correction: { x: 0, y: 0 },
        pace: 0,
        movedAt: 0,
        history: [],
        velocity: { x: 0, y: 0 },
        tilt: 0,
        scale: { value: 1, velocity: 0 },
        opacity: 1,
        drawn: { blur: '', opacity: '', ghosts: [] },
      };
      remotes.set(id, remote);
      publish();
    }
    return remote;
  };

  const signal = (id: string, value: Signal) => {
    const remote = remotes.get(id);
    if (!remote || !published.includes(id)) return;
    remote.signals.push({ at: performance.now(), value });
    wake();
  };

  return {
    move(id: string, { anchor, detail, samples }: Path) {
      const now = performance.now();
      const remote = remoteOf(id);
      remote.cadence.hear(now, samples[0]?.age ?? 0);
      for (const { age, ...placement } of samples) remote.trail.push({ at: now - age, value: { anchor, placement } });
      const latest = samples.at(-1);
      const precision = detail && latest && { anchor, detail, placement: latest };
      remote.precisions.push({ at: now - (latest?.age ?? 0), value: precision });
      wake();
    },
    press: (id: string) => signal(id, 'press'),
    click: (id: string) => signal(id, 'click'),
    release: (id: string) => signal(id, 'release'),
    delayOf(id: string) {
      return remotes.get(id)?.cadence.delay ?? 0;
    },
    leave(id: string) {
      if (inks.has(id) && published.includes(id)) signal(id, 'leave');
      else if (remotes.delete(id)) publish();
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
      window.clearTimeout(timer);
      remotes.clear();
      inks.clear();
    },
  };
}
