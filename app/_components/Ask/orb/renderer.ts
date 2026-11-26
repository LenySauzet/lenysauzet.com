import { SPHERES, TINTS, type Sphere } from './layout';

const VERTEX = `
attribute vec2 aPosition;
varying vec2 vPoint;
void main() {
  vPoint = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vPoint;
uniform vec4 uSpheres[${SPHERES}];
uniform vec3 uTints[${SPHERES}];
uniform vec3 uInk;
uniform float uDark;
uniform float uPixel;

const vec2 RIM = vec2(-0.78, -0.62);
const vec2 GLOW = vec2(0.18, -0.5);
const vec2 TRAIL = vec2(1.0, 0.18);

void main() {
  vec2 p = vPoint * 1.32;
  vec3 light = vec3(0.0);
  for (int i = 0; i < ${SPHERES}; i++) {
    vec4 s = uSpheres[i];
    if (s.w < 0.002) continue;
    vec2 q = p - s.xy;
    float d = length(q);
    float r = s.z;
    float edge = d - r;
    vec2 n = q / max(d, 1e-4);
    float inside = step(edge, 0.0);

    float toward = smoothstep(-0.1, 1.0, dot(n, normalize(TRAIL)));
    float width = max(0.011, uPixel * 1.1) * (1.0 + 7.0 * toward * toward);
    float lit = 0.3 + 0.7 * smoothstep(-0.5, 0.95, dot(n, normalize(RIM)));
    float rim = exp(-pow(edge / width, 2.0)) * lit / (1.0 + 5.0 * toward);

    float innerGlow = inside * exp(edge / (r * 0.16)) * (0.18 + 0.2 * lit);
    float milk = inside * (0.11 + 0.05 * (1.0 - d / r));
    float core = exp(-pow(length(q - GLOW * r) / (r * 0.55), 2.0)) * 0.42;

    float smear = (1.0 - inside) * pow(toward, 1.6) * exp(-edge / (0.04 + 0.17 * toward)) * 0.42;
    float bloom = exp(-pow(edge / 0.09, 2.0)) * 0.08;

    light += uTints[i] * (rim + innerGlow + milk + core + smear + bloom) * s.w;
  }
  float window = 1.0 - smoothstep(0.72, 0.98, length(vPoint));
  vec3 tone = (1.0 - exp(-light * 1.3)) * window;
  float alpha = clamp(max(max(tone.r, tone.g), tone.b), 0.0, 1.0);
  vec3 ink = mix(uInk * alpha, tone, uDark);
  gl_FragColor = vec4(ink, alpha);
}`;

export interface OrbFrame {
  spheres: Sphere[];
  pixel: number;
}

interface Target {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  frame: (time: number, dt: number) => OrbFrame;
}

interface Program {
  gl: WebGLRenderingContext;
  spheres: WebGLUniformLocation | null;
  ink: WebGLUniformLocation | null;
  dark: WebGLUniformLocation | null;
  pixel: WebGLUniformLocation | null;
}

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
};

const inkOf = (dark: boolean): [number, number, number] => {
  if (dark) return [1, 1, 1];
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return [0.1, 0.1, 0.12];
  probe.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() || '#222';
  probe.fillRect(0, 0, 1, 1);
  const [r = 30, g = 30, b = 34] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
};

class Renderer {
  private canvas = document.createElement('canvas');
  private program: Program | null = null;
  private targets = new Set<Target>();
  private raf = 0;
  private last = 0;
  private dark = true;
  private ink: [number, number, number] = [1, 1, 1];
  private theme: MutationObserver | null = null;

  private setup() {
    const gl = this.canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) return null;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(gl.getUniformLocation(program, 'uTints'), TINTS.flat());
    return {
      gl,
      spheres: gl.getUniformLocation(program, 'uSpheres'),
      ink: gl.getUniformLocation(program, 'uInk'),
      dark: gl.getUniformLocation(program, 'uDark'),
      pixel: gl.getUniformLocation(program, 'uPixel'),
    };
  }

  private readTheme = () => {
    this.dark = document.documentElement.classList.contains('dark');
    this.ink = inkOf(this.dark);
  };

  add(target: Target) {
    if (!this.program) this.program = this.setup();
    if (!this.program) return false;
    if (!this.theme) {
      this.readTheme();
      this.theme = new MutationObserver(this.readTheme);
      this.theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    this.targets.add(target);
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
    return true;
  }

  remove(target: Target) {
    this.targets.delete(target);
    if (this.targets.size === 0 && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private tick = (now: number) => {
    const dt = (now - this.last) / 1000;
    this.last = now;
    const program = this.program;
    if (program) {
      const { gl } = program;
      gl.uniform3fv(program.ink, this.ink);
      gl.uniform1f(program.dark, this.dark ? 1 : 0);
      for (const target of this.targets) {
        if (this.canvas.width < target.width || this.canvas.height < target.height) {
          this.canvas.width = Math.max(this.canvas.width, target.width);
          this.canvas.height = Math.max(this.canvas.height, target.height);
        }
        const { spheres, pixel } = target.frame(now / 1000, dt);
        gl.viewport(0, 0, target.width, target.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform4fv(program.spheres, spheres.flatMap((sphere) => [sphere.x, sphere.y, sphere.r, sphere.a]));
        gl.uniform1f(program.pixel, pixel);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        target.context.clearRect(0, 0, target.width, target.height);
        target.context.drawImage(
          this.canvas,
          0,
          this.canvas.height - target.height,
          target.width,
          target.height,
          0,
          0,
          target.width,
          target.height
        );
      }
    }
    this.raf = this.targets.size ? requestAnimationFrame(this.tick) : 0;
  };
}

let shared: Renderer | null = null;

export const orbRenderer = () => (shared ??= new Renderer());
export type { Target as OrbTarget };
