export interface Sphere {
  x: number;
  y: number;
  r: number;
  a: number;
}

export type Count = 1 | 2 | 4;

export const SPHERES = 4;

const hidden = (at: Sphere): Sphere => ({ ...at, a: 0 });

const ONE: Sphere = { x: 0, y: 0, r: 0.62, a: 1 };

export const LAYOUTS: Record<Count, Sphere[]> = {
  1: [ONE, hidden(ONE), hidden(ONE), hidden(ONE)],
  2: [
    { x: -0.17, y: 0.15, r: 0.5, a: 0.9 },
    { x: 0.15, y: -0.13, r: 0.5, a: 1 },
    hidden({ x: 0.15, y: -0.13, r: 0.5, a: 0 }),
    hidden({ x: 0.15, y: -0.13, r: 0.5, a: 0 }),
  ],
  4: [
    { x: -0.27, y: 0.0, r: 0.46, a: 0.8 },
    { x: -0.05, y: -0.25, r: 0.46, a: 1 },
    { x: 0.03, y: 0.27, r: 0.46, a: 0.85 },
    { x: 0.29, y: 0.04, r: 0.46, a: 0.65 },
  ],
};

export const TINTS: [number, number, number][] = [
  [0.93, 0.94, 1.0],
  [1.0, 0.96, 0.98],
  [0.78, 0.73, 1.0],
  [0.98, 0.8, 0.9],
];

const STIFFNESS = 90;
const DAMPING = 14;

export interface Body {
  value: Sphere;
  velocity: Sphere;
}

const KEYS = ['x', 'y', 'r', 'a'] as const;

export function rest(layout: Sphere[]): Body[] {
  return layout.map((sphere) => ({ value: { ...sphere }, velocity: { x: 0, y: 0, r: 0, a: 0 } }));
}

export function step(bodies: Body[], target: Sphere[], dt: number): boolean {
  const h = Math.min(dt, 1 / 30);
  let moving = false;
  bodies.forEach((body, index) => {
    const goal = target[index];
    if (!goal) return;
    for (const key of KEYS) {
      const force = STIFFNESS * (goal[key] - body.value[key]) - DAMPING * body.velocity[key];
      body.velocity[key] += force * h;
      body.value[key] += body.velocity[key] * h;
      if (Math.abs(goal[key] - body.value[key]) > 1e-4 || Math.abs(body.velocity[key]) > 1e-4) moving = true;
    }
  });
  return moving;
}

export function breathe(sphere: Sphere, index: number, time: number, spin: number): Sphere {
  const angle = spin * time;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const drift = 0.018;
  const x = sphere.x * cos - sphere.y * sin + drift * Math.sin(time * 0.9 + index * 1.7);
  const y = sphere.x * sin + sphere.y * cos + drift * Math.cos(time * 0.7 + index * 2.3);
  return { x, y, r: sphere.r * (1 + 0.025 * Math.sin(time * 1.1 + index)), a: Math.max(0, Math.min(1, sphere.a)) };
}
