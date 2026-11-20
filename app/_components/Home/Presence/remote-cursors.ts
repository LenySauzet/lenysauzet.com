import { createPlacer } from '@/lib/presence/anchors';
import { blurFor, damp, pressScaleAfter, tiltFor, Trail, type Vector } from '@/lib/presence/motion';
import type { Point, ServerMessage } from '@/lib/presence/protocol';

const DELAY = 100;
const LAG = 70;
const SETTLE = 90;
const IDLE = 6000;
const MOST_SHOWN = 10;
const LONGEST_FRAME = 64;

interface Remote {
  trail: Trail<Point>;
  seenAt: number;
  pressedAt: number;
  shown?: Vector;
  velocity: Vector;
  tilt: number;
  blur: string;
}

interface Ink {
  element: HTMLDivElement;
  blur: SVGFEGaussianBlurElement | null;
}

export function createRemoteCursors(onChange: (ids: string[]) => void, isStill: () => boolean) {
  const remotes = new Map<string, Remote>();
  const inks = new Map<string, Ink>();
  let published: string[] = [];
  let frame = 0;
  let drewAt = 0;

  const publish = () => {
    const shown = [...remotes.keys()].slice(0, MOST_SHOWN);
    if (shown.length === published.length && shown.every((id, index) => id === published[index])) return;
    published = shown;
    onChange(shown);
  };

  const forget = (id: string) => {
    if (remotes.delete(id)) publish();
  };

  const see = (id: string, point: Point, now: number) => {
    let remote = remotes.get(id);
    if (!remote) {
      remote = { trail: new Trail(), seenAt: now, pressedAt: -Infinity, velocity: { x: 0, y: 0 }, tilt: 0, blur: '' };
      remotes.set(id, remote);
      publish();
    }
    remote.trail.push({ at: now, value: point });
    remote.seenAt = now;
    wake();
  };

  const draw = (now: number) => {
    const elapsed = Math.min(LONGEST_FRAME, now - drewAt || 16);
    const still = isStill();
    const place = createPlacer();
    drewAt = now;

    for (const [id, remote] of remotes) if (now - remote.seenAt > IDLE) forget(id);

    const targets = published.map((id) => {
      const remote = remotes.get(id)!;
      return { remote, ink: inks.get(id), target: remote.trail.at(now - DELAY, place) };
    });

    for (const { remote, ink, target } of targets) {
      if (!ink || !target) continue;

      const previous = remote.shown ?? target;
      const shown = { x: damp(previous.x, target.x, LAG, elapsed), y: damp(previous.y, target.y, LAG, elapsed) };
      remote.velocity = {
        x: damp(remote.velocity.x, (shown.x - previous.x) / elapsed, SETTLE, elapsed),
        y: damp(remote.velocity.y, (shown.y - previous.y) / elapsed, SETTLE, elapsed),
      };
      remote.tilt = still ? 0 : damp(remote.tilt, tiltFor(remote.velocity.x), SETTLE, elapsed);
      if (!remote.shown) ink.element.style.visibility = 'visible';
      remote.shown = shown;

      const scale = still ? 1 : pressScaleAfter(now - remote.pressedAt);
      ink.element.style.transform = `translate3d(${shown.x}px, ${shown.y}px, 0) rotate(${remote.tilt}deg) scale(${scale})`;

      const blur = still ? '0 0' : `${blurFor(remote.velocity.x).toFixed(1)} ${blurFor(remote.velocity.y).toFixed(1)}`;
      if (blur !== remote.blur) {
        ink.blur?.setAttribute('stdDeviation', blur);
        remote.blur = blur;
      }
    }

    frame = remotes.size ? window.requestAnimationFrame(draw) : 0;
  };

  const wake = () => {
    if (!frame) frame = window.requestAnimationFrame(draw);
  };

  return {
    receive(message: ServerMessage) {
      const now = performance.now();
      switch (message.type) {
        case 'snapshot':
          for (const { id, point } of message.cursors) see(id, point, now);
          return;
        case 'move':
          return see(message.id, message.point, now);
        case 'press': {
          const remote = remotes.get(message.id);
          if (remote) remote.pressedAt = now;
          return wake();
        }
        case 'leave':
          return forget(message.id);
      }
    },
    attach(id: string, element: HTMLDivElement | null) {
      if (element) inks.set(id, { element, blur: element.querySelector('feGaussianBlur') });
      else inks.delete(id);
    },
    stop() {
      window.cancelAnimationFrame(frame);
      remotes.clear();
      inks.clear();
    },
  };
}
