import { blurFor, damp, lineAt, spring, tiltFor, type Spring, type Timed, type Vector } from './motion';

export const GHOSTS = 4;

const LAG = 28;
const SETTLE = 90;
const PRESSED_SCALE = 0.8;
const PRESS = { stiffness: 420, damping: 24 };
const MOVING = 0.03;
const RESTING_AFTER = 1000;
const RESTING_OPACITY = 0.22;
const WAKING = 50;
const RESTING = 180;
const SHUTTER = 56;
const GHOST_OPACITY = 0.45;
const FULL_SMEAR = 0.8;
const REST_DISTANCE = 0.05;
const REST_SPEED = 0.0005;
const REST_SCALE = 0.005;
const REST_TILT = 0.05;
const REST_OPACITY = 0.005;

export interface Pose {
  shown: Vector;
  velocity: Vector;
  tilt: number;
  scale: Spring;
  opacity: number;
  movedAt: number;
  history: Timed<Vector>[];
}

export interface Step {
  target: Vector;
  now: number;
  elapsed: number;
  pressed: boolean;
  reducedMotion: boolean;
}

export interface Ghost {
  point: Vector;
  opacity: number;
}

export const poseAt = (point: Vector, now: number): Pose => ({
  shown: point,
  velocity: { x: 0, y: 0 },
  tilt: 0,
  scale: { value: 1, velocity: 0 },
  opacity: 1,
  movedAt: now,
  history: [],
});

const speedOf = ({ velocity }: Pose) => Math.hypot(velocity.x, velocity.y);

export function stepPose(pose: Pose, { target, now, elapsed, pressed, reducedMotion }: Step) {
  const previous = pose.shown;
  pose.shown = { x: damp(previous.x, target.x, LAG, elapsed), y: damp(previous.y, target.y, LAG, elapsed) };
  pose.velocity = {
    x: damp(pose.velocity.x, (pose.shown.x - previous.x) / elapsed, SETTLE, elapsed),
    y: damp(pose.velocity.y, (pose.shown.y - previous.y) / elapsed, SETTLE, elapsed),
  };
  while (pose.history[0] && pose.history[0].at <= now - SHUTTER * 2) pose.history.shift();
  pose.history.push({ at: now, value: pose.shown });

  const speed = speedOf(pose);
  if (speed > MOVING || pressed) pose.movedAt = now;
  const awake = now - pose.movedAt < RESTING_AFTER;
  const scaleGoal = pressed ? PRESSED_SCALE : 1;
  const opacityGoal = awake ? 1 : RESTING_OPACITY;
  pose.tilt = reducedMotion ? 0 : damp(pose.tilt, tiltFor(pose.velocity), SETTLE, elapsed);
  pose.scale = reducedMotion ? { value: scaleGoal, velocity: 0 } : spring(pose.scale, scaleGoal, elapsed, PRESS);
  pose.opacity = damp(pose.opacity, opacityGoal, awake ? WAKING : RESTING, elapsed);

  const settled =
    Math.hypot(target.x - pose.shown.x, target.y - pose.shown.y) <= REST_DISTANCE &&
    speed <= REST_SPEED &&
    Math.abs(pose.scale.value - scaleGoal) + Math.abs(pose.scale.velocity) <= REST_SCALE &&
    Math.abs(pose.tilt) <= REST_TILT &&
    Math.abs(pose.opacity - opacityGoal) <= REST_OPACITY;

  return { settled, restsIn: awake ? pose.movedAt + RESTING_AFTER - now : undefined };
}

export function ghostsOf(pose: Pose, now: number, reducedMotion: boolean): Ghost[] {
  const smear = reducedMotion ? 0 : Math.min(1, speedOf(pose) / FULL_SMEAR) * pose.opacity;
  return Array.from({ length: GHOSTS }, (_, index) => {
    const order = index + 1;
    return {
      point: lineAt(pose.history, now - (order * SHUTTER) / GHOSTS) ?? pose.shown,
      opacity: GHOST_OPACITY * smear * (1 - order / (GHOSTS + 1)),
    };
  });
}

export const blurOf = ({ velocity }: Pose, reducedMotion: boolean) =>
  reducedMotion ? '0 0' : `${blurFor(velocity.x).toFixed(1)} ${blurFor(velocity.y).toFixed(1)}`;
