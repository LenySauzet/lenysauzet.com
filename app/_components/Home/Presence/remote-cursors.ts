import { createPlacer } from '@/lib/presence/anchors';
import { blurFor, damp, tiltFor, Trail, type Vector } from '@/lib/presence/motion';
import type { Point } from '@/lib/presence/protocol';

const DELAY = 100;
const LAG = 70;
const SETTLE = 90;
const PRESS_LAG = 45;
const PRESSED_SCALE = 0.82;
const LONGEST_PRESS = 4000;
const RESTING_AFTER = 3000;
const RESTING_OPACITY = '0.2';
const MOST_SHOWN = 10;
const LONGEST_FRAME = 64;
const AT_REST = 0.05;

interface Remote {
  trail: Trail<Point>;
  seenAt: number;
  pressedAt?: number;
  shown?: Vector;
  velocity: Vector;
  tilt: number;
  scale: number;
  blur: string;
  opacity: string;
}

interface Ink {
  element: HTMLDivElement;
  blur: SVGFEGaussianBlurElement | null;
}

export function createRemoteCursors(onChange: (ids: string[]) => void, isStill: () => boolean) {
  const listening = new AbortController();
  const remotes = new Map<string, Remote>();
  const inks = new Map<string, Ink>();
  let published: string[] = [];
  let frame = 0;
  let drewAt = 0;
  let restTimer = 0;

  const publish = () => {
    const shown = [...remotes.keys()].slice(0, MOST_SHOWN);
    if (shown.length === published.length && shown.every((id, index) => id === published[index])) return;
    published = shown;
    onChange(shown);
  };

  const wake = () => {
    if (!frame) frame = window.requestAnimationFrame(draw);
  };

  const draw = (now: number) => {
    const elapsed = Math.min(LONGEST_FRAME, now - drewAt || 16);
    const still = isStill();
    const place = createPlacer();
    const scroll = { x: window.scrollX, y: window.scrollY };
    drewAt = now;

    let moving = false;
    let nextRest = Infinity;
    const targets = published.map((id) => {
      const remote = remotes.get(id)!;
      return { remote, ink: inks.get(id), target: remote.trail.at(now - DELAY, place) };
    });

    for (const { remote, ink, target } of targets) {
      if (!ink || !target) continue;

      if (remote.pressedAt !== undefined && now - remote.pressedAt > LONGEST_PRESS) remote.pressedAt = undefined;

      const previous = remote.shown ?? target;
      const shown = { x: damp(previous.x, target.x, LAG, elapsed), y: damp(previous.y, target.y, LAG, elapsed) };
      remote.velocity = {
        x: damp(remote.velocity.x, (shown.x - previous.x) / elapsed, SETTLE, elapsed),
        y: damp(remote.velocity.y, (shown.y - previous.y) / elapsed, SETTLE, elapsed),
      };
      remote.tilt = still ? 0 : damp(remote.tilt, tiltFor(remote.velocity.x), SETTLE, elapsed);
      remote.scale = still
        ? 1
        : damp(remote.scale, remote.pressedAt === undefined ? 1 : PRESSED_SCALE, PRESS_LAG, elapsed);
      if (!remote.shown) ink.element.style.visibility = 'visible';
      remote.shown = shown;

      ink.element.style.transform = `translate3d(${shown.x - scroll.x}px, ${shown.y - scroll.y}px, 0) rotate(${remote.tilt}deg) scale(${remote.scale})`;

      const blur = still ? '0 0' : `${blurFor(remote.velocity.x).toFixed(1)} ${blurFor(remote.velocity.y).toFixed(1)}`;
      if (blur !== remote.blur) {
        ink.blur?.setAttribute('stdDeviation', blur);
        remote.blur = blur;
      }

      const opacity = now - remote.seenAt > RESTING_AFTER ? RESTING_OPACITY : '1';
      if (opacity !== remote.opacity) {
        ink.element.style.opacity = opacity;
        remote.opacity = opacity;
      }
      if (opacity === '1') nextRest = Math.min(nextRest, remote.seenAt + RESTING_AFTER - now);

      const scaleGoal = still || remote.pressedAt === undefined ? 1 : PRESSED_SCALE;
      moving ||=
        Math.hypot(target.x - shown.x, target.y - shown.y) > AT_REST ||
        Math.hypot(remote.velocity.x, remote.velocity.y) > AT_REST / 100 ||
        Math.abs(remote.scale - scaleGoal) > AT_REST / 10 ||
        Math.abs(remote.tilt) > AT_REST;
    }

    window.clearTimeout(restTimer);
    if (moving || targets.some(({ remote, ink }) => ink && !remote.shown)) {
      frame = window.requestAnimationFrame(draw);
      return;
    }
    frame = 0;
    if (Number.isFinite(nextRest)) restTimer = window.setTimeout(wake, Math.max(0, nextRest) + 1);
  };

  window.addEventListener('scroll', () => wake(), { passive: true, signal: listening.signal });
  window.addEventListener('resize', () => wake(), { passive: true, signal: listening.signal });

  const touch = (id: string, now: number) => {
    let remote = remotes.get(id);
    if (!remote) {
      remote = {
        trail: new Trail(),
        seenAt: now,
        velocity: { x: 0, y: 0 },
        tilt: 0,
        scale: 1,
        blur: '',
        opacity: '',
      };
      remotes.set(id, remote);
      publish();
    }
    remote.seenAt = now;
    wake();
    return remote;
  };

  return {
    move(id: string, point: Point) {
      const now = performance.now();
      touch(id, now).trail.push({ at: now, value: point });
    },
    press(id: string) {
      const remote = remotes.get(id);
      if (!remote) return;
      remote.pressedAt = remote.seenAt = performance.now();
      wake();
    },
    release(id: string) {
      const remote = remotes.get(id);
      if (!remote) return;
      remote.pressedAt = undefined;
      remote.seenAt = performance.now();
      wake();
    },
    remove(id: string) {
      if (remotes.delete(id)) publish();
    },
    keepOnly(ids: Set<string>) {
      for (const id of remotes.keys()) if (!ids.has(id)) remotes.delete(id);
      publish();
    },
    attach(id: string, element: HTMLDivElement | null) {
      if (element) {
        inks.set(id, { element, blur: element.querySelector('feGaussianBlur') });
        wake();
      } else inks.delete(id);
    },
    stop() {
      listening.abort();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(restTimer);
      remotes.clear();
      inks.clear();
    },
  };
}
