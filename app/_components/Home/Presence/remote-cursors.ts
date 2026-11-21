import { createPlacer } from '@/lib/presence/anchors';
import type { FrameEvent } from '@/lib/presence/frames';
import type { Placement } from '@/lib/presence/geometry';
import { Cadence, damp, Trail, type Timed, type Vector } from '@/lib/presence/motion';
import { blurOf, ghostsOf, poseAt, stepPose, type Pose } from '@/lib/presence/pose';
import type { Detail, Path, Pull } from '@/lib/presence/protocol';

const SETTLE = 90;
const LONGEST_PRESS = 4000;
const SHORTEST_PRESS = 120;
const LONGEST_FRAME = 64;
const MOST_SHOWN = 10;
const MOST_PRECISIONS = 16;
const PRECISE_BELOW = 0.45;
const CORRECTING = 110;
const REST_PACE = 0.0005;
const REST_CORRECTION = 0.05;
const SIZE_SLACK = 0.4;
const SMALLEST = 8;
const CLICKS_APART = 150;
const STILL: Vector = { x: 0, y: 0 };

export const MARK_SIZE = 20;

export interface Ink {
  main: HTMLElement;
  ghosts: HTMLElement[];
  blur: SVGFEGaussianBlurElement | null;
}

interface Placed {
  anchor: string;
  placement: Placement;
}

interface Precision {
  anchor: string;
  detail: Detail;
  placement: Placement;
}

type Signal =
  { kind: 'press' | 'release' | 'click' | 'leave' } | { kind: 'pull'; pull: Pull } | { kind: 'drop'; frame: string };

interface Remote {
  trail: Trail<Placed>;
  cadence: Cadence;
  signals: Timed<Signal>[];
  precisions: Timed<Precision | undefined>[];
  correction: Vector;
  followed?: Vector;
  pace: number;
  pressed?: Timed<Vector>;
  letGoAt?: number;
  pressedAt?: Vector;
  clickedAt: number;
  pose?: Pose;
  drawn: { blur: string; opacity: string; ghosts: string[] };
}

interface RemoteCursorsOptions {
  onChange: (ids: string[]) => void;
  onClick: (point: Vector) => void;
  onPress: (id: string, point: Vector, at: number) => void;
  onFrame: (id: string, event: FrameEvent) => void;
  onDrawn: (points: Map<string, Vector>) => void;
  reducedMotion: () => boolean;
}

const sameSize = (here: { width: number; height: number }, there: { width: number; height: number }) =>
  Math.abs(here.width - there.width) <= SIZE_SLACK * Math.max(there.width, SMALLEST) &&
  Math.abs(here.height - there.height) <= SIZE_SLACK * Math.max(there.height, SMALLEST);

const frameEventOf = (signal: Signal): FrameEvent | undefined =>
  signal.kind === 'pull'
    ? { type: 'pull', pull: signal.pull }
    : signal.kind === 'drop'
      ? { type: 'drop', frame: signal.frame }
      : undefined;

const newRemote = (): Remote => ({
  trail: new Trail(),
  cadence: new Cadence(),
  signals: [],
  precisions: [],
  correction: STILL,
  pace: 0,
  clickedAt: -Infinity,
  drawn: { blur: '', opacity: '', ghosts: [] },
});

const fade = (element: HTMLElement, opacity: number, drawn: string) => {
  const written = opacity.toFixed(3);
  if (written !== drawn) element.style.opacity = written;
  return written;
};

export function createRemoteCursors({
  onChange,
  onClick,
  onPress,
  onFrame,
  onDrawn,
  reducedMotion,
}: RemoteCursorsOptions) {
  const listening = new AbortController();
  const remotes = new Map<string, Remote>();
  const inks = new Map<string, Ink>();
  let hands = new Set<string>();
  let published: string[] = [];
  let rafId = 0;
  let drewAt = 0;
  let timer = 0;
  let covered = false;

  const publish = () => {
    const shown = [...remotes.keys()].slice(0, MOST_SHOWN);
    if (shown.length === published.length && shown.every((id, index) => id === published[index])) return;
    published = shown;
    onChange(shown);
  };

  const wake = () => {
    if (!rafId && !covered && published.length) rafId = window.requestAnimationFrame(draw);
  };

  const forget = (id: string) => {
    const remote = remotes.get(id);
    if (!remote) return;
    for (const { value } of remote.signals) {
      const event = frameEventOf(value);
      if (event) onFrame(id, event);
    }
    remotes.delete(id);
  };

  const draw = (now: number) => {
    rafId = 0;
    const elapsed = Math.min(LONGEST_FRAME, now - drewAt || 16);
    const still = reducedMotion();
    const { place, box } = createPlacer();
    const resolve = ({ anchor, placement }: Placed) => place({ anchor, part: '' }, placement);
    const offsetOf = (precision: Precision | undefined): Vector => {
      if (!precision) return STILL;
      const { anchor, detail, placement } = precision;
      const target = { anchor, part: detail.part };
      const here = box(target);
      if (!here || !sameSize(here, detail)) return STILL;
      const precise = place(target, { x: detail.x, y: detail.y, dx: 0, dy: 0 });
      const coarse = place({ anchor, part: '' }, placement);
      return precise && coarse ? { x: precise.x - coarse.x, y: precise.y - coarse.y } : STILL;
    };
    const scroll = { x: window.scrollX, y: window.scrollY };
    const clicks: Vector[] = [];
    const presses: { id: string; point: Vector; at: number }[] = [];
    const departed: string[] = [];
    drewAt = now;

    const read = published.flatMap((id) => {
      const remote = remotes.get(id);
      const ink = inks.get(id);
      if (!remote || !ink) return [];
      const time = now - remote.cadence.delay;
      const path = remote.trail.at(time, resolve);

      while ((remote.precisions[1]?.at ?? Infinity) <= time) remote.precisions.shift();
      const due = remote.precisions[0];
      const offset = due && due.at <= time ? offsetOf(due.value) : STILL;
      const travelled =
        path && remote.followed ? Math.hypot(path.x - remote.followed.x, path.y - remote.followed.y) : 0;
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
        const signal = next.value;
        const point = remote.pose?.shown ?? target;
        const event = frameEventOf(signal);
        if (event) onFrame(id, event);
        else if (signal.kind === 'leave') {
          if ((remote.trail.latest?.at ?? 0) <= next.at) departed.push(id);
        } else if (signal.kind === 'press') {
          remote.pressed = point && { at: now, value: point };
          remote.letGoAt = undefined;
          remote.pressedAt = point;
          if (point) presses.push({ id, point, at: next.at });
        } else if (signal.kind === 'release') {
          if (remote.pressed) remote.letGoAt = remote.pressed.at + SHORTEST_PRESS;
        } else {
          const at = remote.pressedAt ?? point;
          remote.pressedAt = undefined;
          if (at && now - remote.clickedAt >= CLICKS_APART) clicks.push(at);
          remote.clickedAt = now;
        }
      }
      return target ? [{ id, remote, ink, time, target, aim }] : [];
    });

    let busy = false;
    let wakeIn = Infinity;
    const drawn = new Map<string, Vector>();

    for (const { id, remote, ink, time, target, aim } of read) {
      if (remote.pressed && (now - remote.pressed.at > LONGEST_PRESS || now >= (remote.letGoAt ?? Infinity))) {
        remote.pressed = undefined;
        remote.letGoAt = undefined;
      }
      if (!remote.pose) {
        remote.pose = poseAt(target, now);
        ink.main.style.visibility = 'visible';
      }
      const { pose } = remote;
      const { settled, restsIn } = stepPose(pose, {
        target,
        now,
        elapsed,
        pressed: remote.pressed !== undefined,
        reducedMotion: still,
      });

      drawn.set(id, pose.shown);
      const turn = `rotate(${pose.tilt}deg) scale(${pose.scale.value})`;
      const pivot = hands.has(id) ? MARK_SIZE / 2 : 0;
      ink.main.style.transform = `translate3d(${pose.shown.x - scroll.x + pivot}px, ${pose.shown.y - scroll.y + pivot}px, 0) ${turn} translate(${-pivot}px, ${-pivot}px)`;
      remote.drawn.opacity = fade(ink.main, pose.opacity, remote.drawn.opacity);
      ghostsOf(pose, now, still).forEach(({ point, opacity }, index) => {
        const ghost = ink.ghosts[index];
        if (!ghost) return;
        remote.drawn.ghosts[index] = fade(ghost, opacity, remote.drawn.ghosts[index] ?? '');
        if (opacity > 0)
          ghost.style.transform = `translate3d(${point.x - scroll.x}px, ${point.y - scroll.y}px, 0) ${turn}`;
      });
      const blur = blurOf(pose, still);
      if (blur !== remote.drawn.blur) {
        ink.blur?.setAttribute('stdDeviation', blur);
        remote.drawn.blur = blur;
      }

      if (restsIn !== undefined) wakeIn = Math.min(wakeIn, restsIn);
      if (remote.pressed)
        wakeIn = Math.min(wakeIn, Math.min(remote.letGoAt ?? Infinity, remote.pressed.at + LONGEST_PRESS) - now);
      busy ||=
        !settled ||
        remote.pace > REST_PACE ||
        Math.hypot(remote.correction.x - aim.x, remote.correction.y - aim.y) > REST_CORRECTION ||
        remote.signals.length > 0 ||
        (remote.trail.latest?.at ?? 0) > time;
    }

    for (const { id, point, at } of presses) onPress(id, point, at);
    for (const point of clicks) onClick(point);
    onDrawn(drawn);
    if (departed.length) {
      for (const id of departed) forget(id);
      publish();
    }

    window.clearTimeout(timer);
    if (busy) wake();
    else if (Number.isFinite(wakeIn)) timer = window.setTimeout(wake, Math.max(0, wakeIn) + 1);
  };

  window.addEventListener('scroll', wake, { passive: true, signal: listening.signal });
  window.addEventListener('resize', wake, { passive: true, signal: listening.signal });

  const remoteOf = (id: string) => {
    let remote = remotes.get(id);
    if (!remote) {
      remote = newRemote();
      remotes.set(id, remote);
      publish();
    }
    return remote;
  };

  const markHand = (id: string, { main, ghosts }: Ink) => {
    for (const element of [main, ...ghosts]) element.toggleAttribute('data-hand', hands.has(id));
  };

  const remove = (id: string) => {
    forget(id);
    publish();
  };

  const signal = (id: string, value: Signal) => {
    const remote = remotes.get(id);
    const drawn = remote && published.includes(id) && inks.has(id);
    const event = frameEventOf(value);
    if (!drawn) {
      if (event) onFrame(id, event);
      return;
    }
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
      if (remote.precisions.length > MOST_PRECISIONS) remote.precisions.shift();
      wake();
    },
    press: (id: string) => signal(id, { kind: 'press' }),
    release: (id: string) => signal(id, { kind: 'release' }),
    click: (id: string) => signal(id, { kind: 'click' }),
    pull: (id: string, pull: Pull) => signal(id, { kind: 'pull', pull }),
    drop: (id: string, frame: string) => signal(id, { kind: 'drop', frame }),
    leave(id: string) {
      if (published.includes(id) && inks.has(id)) signal(id, { kind: 'leave' });
      else remove(id);
    },
    remove,
    keepOnly(ids: Set<string>) {
      for (const id of [...remotes.keys()]) if (!ids.has(id)) forget(id);
      publish();
    },
    attach(id: string, ink: Ink | null) {
      if (ink) {
        inks.set(id, ink);
        markHand(id, ink);
        wake();
      } else inks.delete(id);
    },
    showHands(ids: Set<string>) {
      hands = ids;
      for (const [id, ink] of inks) markHand(id, ink);
    },
    cover(next: boolean) {
      covered = next;
      if (covered) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else wake();
    },
    stop() {
      listening.abort();
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timer);
      remotes.clear();
      inks.clear();
    },
  };
}

export type RemoteCursors = ReturnType<typeof createRemoteCursors>;
