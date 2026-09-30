// A small 3D scene description and renderer, shared by the browser (canvas) and the build (SVG poster).
// The scene is flat plates stacked in space, with boxes standing on them, traces across them and
// risers between them. render() turns one frame of it into 2D primitives, back to front.

export type Vec3 = readonly [number, number, number];
export type ToneName = "plate" | "light" | "dark" | "teal";

export interface Tone {
  readonly top: string;
  readonly sideA: string;
  readonly sideB: string;
  /** Outline, so faces stay distinct on a light ground. */
  readonly edge: string;
}

export interface Palette {
  readonly tones: Readonly<Record<ToneName, Tone>>;
  readonly plateAlpha: number;
  readonly ink: string;
  readonly muted: string;
  readonly pulse: string;
}

export interface Box {
  readonly x: number;
  readonly z: number;
  readonly w: number;
  readonly d: number;
  readonly h: number;
  readonly tone: ToneName;
}

export interface Plate {
  readonly size: number;
  readonly grid: number;
  readonly boxes: readonly Box[];
}

/** A path drawn on a plate's top surface, as x/z points. */
export interface Trace {
  readonly plate: number;
  readonly points: readonly (readonly [number, number])[];
}

/** A vertical link from the top of plate `from` up to the underside of plate `from - 1`. */
export interface Riser {
  readonly from: number;
  readonly x: number;
  readonly z: number;
}

export interface Pulse {
  readonly on: "trace" | "riser";
  readonly index: number;
  readonly phase: number;
  /** Cycles per second. */
  readonly speed: number;
}

export interface SceneModel {
  readonly plates: readonly Plate[];
  readonly traces: readonly Trace[];
  readonly risers: readonly Riser[];
  readonly pulses: readonly Pulse[];
  readonly thickness: number;
  /** Gap between plates when assembled (spread 0) and fully exploded (spread 1). */
  readonly gap: readonly [number, number];
  readonly labels: boolean;
}

export interface Frame {
  readonly time: number;
  readonly yaw: number;
  readonly pitch: number;
  readonly spread: number;
  /** Where the light is, in viewport fractions from the centre (-1 to 1). */
  readonly light: readonly [number, number];
  readonly pulses: boolean;
  /** A plate to outline in teal, such as the one whose label has focus. */
  readonly highlight?: number;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
  /** Focal length as a fraction of the smaller viewport side. */
  readonly zoom: number;
  readonly distance: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

export type Primitive =
  | { readonly kind: "poly"; readonly points: number[]; readonly fill?: string; readonly stroke?: string; readonly width?: number; readonly alpha: number }
  | { readonly kind: "line"; readonly points: number[]; readonly stroke: string; readonly width: number; readonly alpha: number }
  | { readonly kind: "dot"; readonly x: number; readonly y: number; readonly r: number; readonly fill: string; readonly alpha: number }
  | { readonly kind: "text"; readonly x: number; readonly y: number; readonly text: string; readonly fill: string; readonly alpha: number };

export interface SceneOutput {
  readonly primitives: Primitive[];
  /** Screen position of each plate's right-hand corner, for callout lines. */
  readonly anchors: { x: number; y: number }[];
}

const PULSE_TRAVEL = 1;
const PULSE_FLASH = 0.3;
const PULSE_CYCLE = 1.7;

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Rotates world points into view space: yaw about the vertical axis, then pitch so the camera looks down. */
export function viewTransform(yaw: number, pitch: number): (p: Vec3) => Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return ([x, y, z]) => {
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    return [x1, y * cp + z1 * sp, z1 * cp - y * sp];
  };
}

export interface Projected {
  readonly x: number;
  readonly y: number;
  /** Distance from the camera. */
  readonly depth: number;
}

export function projector(frame: Pick<Frame, "yaw" | "pitch">, view: Viewport): (p: Vec3) => Projected {
  const toView = viewTransform(frame.yaw, frame.pitch);
  const focal = Math.min(view.width, view.height) * view.zoom;
  const cx = view.width * (0.5 + (view.offsetX ?? 0));
  const cy = view.height * (0.5 + (view.offsetY ?? 0));
  return (p) => {
    const [x, y, z] = toView(p);
    const depth = view.distance + z;
    const scale = focal / depth;
    return { x: cx + x * scale, y: cy - y * scale, depth };
  };
}

export function plateHeights(model: SceneModel, spread: number): number[] {
  const gap = mix(model.gap[0], model.gap[1], clamp(spread, 0, 1));
  const middle = (model.plates.length - 1) / 2;
  return model.plates.map((_, index) => (middle - index) * gap);
}

/** Position of a pulse along its path (0 to 1), or how far through its arrival flash it is. */
export function pulseState(pulse: Pulse, time: number): { travel?: number; flash?: number } {
  const u = ((((time * pulse.speed + pulse.phase) % 1) + 1) % 1) * PULSE_CYCLE;
  if (u <= PULSE_TRAVEL) return { travel: u };
  if (u <= PULSE_TRAVEL + PULSE_FLASH) return { flash: (u - PULSE_TRAVEL) / PULSE_FLASH };
  return {};
}

export function pointAlong(points: readonly Vec3[], t: number): Vec3 {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1], p[2] - points[i][2]));
  let remaining = clamp(t, 0, 1) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] === 0 ? 0 : clamp(remaining / lengths[i], 0, 1);
      const [a, b] = [points[i], points[i + 1]];
      return [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
    }
    remaining -= lengths[i];
  }
  return points[points.length - 1];
}

type Flash = { x: number; z: number; k: number };

interface Context {
  readonly model: SceneModel;
  readonly frame: Frame;
  readonly view: Viewport;
  readonly palette: Palette;
  readonly project: (p: Vec3) => Projected;
  readonly toView: (p: Vec3) => Vec3;
  readonly out: Primitive[];
}

const flat = (points: readonly Projected[]): number[] => points.flatMap((p) => [p.x, p.y]);

const BOX_FACES: readonly { normal: Vec3; side: "top" | "sideA" | "sideB"; corners: (b: number[]) => Vec3[] }[] = [
  { normal: [0, 1, 0], side: "top", corners: ([x0, x1, , y1, z0, z1]) => [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
  { normal: [1, 0, 0], side: "sideA", corners: ([, x1, y0, y1, z0, z1]) => [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] },
  { normal: [-1, 0, 0], side: "sideA", corners: ([x0, , y0, y1, z0, z1]) => [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]] },
  { normal: [0, 0, 1], side: "sideB", corners: ([x0, x1, y0, y1, , z1]) => [[x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1]] },
  { normal: [0, 0, -1], side: "sideB", corners: ([x0, x1, y0, y1, z0]) => [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] },
];

function drawBox(ctx: Context, centre: Vec3, size: Vec3, tone: Tone, alpha: number, glow = 0): void {
  const [cx, base, cz] = centre;
  const [w, h, d] = size;
  const bounds = [cx - w / 2, cx + w / 2, base, base + h, cz - d / 2, cz + d / 2];
  for (const face of BOX_FACES) {
    const corners = face.corners(bounds);
    // A face is visible when it points towards the camera, which sits at -distance in view space.
    const mid: Vec3 = [
      corners.reduce((s, c) => s + c[0], 0) / 4,
      corners.reduce((s, c) => s + c[1], 0) / 4,
      corners.reduce((s, c) => s + c[2], 0) / 4,
    ];
    const [vx, vy, vz] = ctx.toView(mid);
    const [nx, ny, nz] = ctx.toView(face.normal);
    if (nx * vx + ny * vy + nz * (vz + ctx.view.distance) >= 0) continue;
    const points = flat(corners.map(ctx.project));
    ctx.out.push({ kind: "poly", points, fill: tone[face.side], stroke: tone.edge, width: 0.6, alpha });
    if (glow > 0 && face.side === "top") ctx.out.push({ kind: "poly", points, fill: ctx.palette.pulse, alpha: glow * alpha });
  }
}

function drawPulse(ctx: Context, path: readonly Vec3[], travel: number, alpha: number): void {
  const head = ctx.project(pointAlong(path, travel));
  const tail = [0.18, 0.12, 0.06].map((back) => ctx.project(pointAlong(path, Math.max(0, travel - back))));
  const colour = ctx.palette.pulse;
  ctx.out.push({ kind: "line", points: flat([...tail, head]), stroke: colour, width: 1.6, alpha: 0.55 * alpha });
  ctx.out.push({ kind: "dot", x: head.x, y: head.y, r: 6, fill: colour, alpha: 0.16 * alpha });
  ctx.out.push({ kind: "dot", x: head.x, y: head.y, r: 2.2, fill: colour, alpha });
}

/** Where pulses have just arrived: rings on plates, and which paths are briefly lit. */
function collectFlashes(model: SceneModel, frame: Frame) {
  const rings: Flash[][] = model.plates.map(() => []);
  const risers = new Map<number, number>();
  const traces = new Map<number, number>();
  if (!frame.pulses) return { rings, risers, traces };
  for (const pulse of model.pulses) {
    const { flash } = pulseState(pulse, frame.time);
    if (flash === undefined) continue;
    if (pulse.on === "riser") {
      const riser = model.risers[pulse.index];
      rings[riser.from - 1]?.push({ x: riser.x, z: riser.z, k: flash });
      risers.set(pulse.index, flash);
    } else {
      const trace = model.traces[pulse.index];
      const [x, z] = trace.points[trace.points.length - 1];
      rings[trace.plate].push({ x, z, k: flash });
      traces.set(pulse.index, flash);
    }
  }
  return { rings, risers, traces };
}

function drawPlateSurface(ctx: Context, index: number, top: number, alpha: number): Projected[] {
  const { model, palette, project, out, view, frame } = ctx;
  const plate = model.plates[index];
  const s = plate.size / 2;

  // Fine grid.
  for (let g = 1; g < plate.grid; g++) {
    const t = -s + (plate.size * g) / plate.grid;
    out.push({ kind: "line", points: flat([project([t, top, -s]), project([t, top, s])]), stroke: palette.ink, width: 0.5, alpha: 0.09 * alpha });
    out.push({ kind: "line", points: flat([project([-s, top, t]), project([s, top, t])]), stroke: palette.ink, width: 0.5, alpha: 0.09 * alpha });
  }

  // Edges, lit teal where they face the light.
  const lightX = view.width * (0.5 + frame.light[0] / 2);
  const lightY = view.height * (0.5 + frame.light[1] / 2);
  const reach = Math.min(view.width, view.height) * 0.75;
  const corners = ([[-s, -s], [s, -s], [s, s], [-s, s]] as const).map(([x, z]) => project([x, top, z]));
  corners.forEach((a, k) => {
    const b = corners[(k + 1) % 4];
    out.push({ kind: "line", points: flat([a, b]), stroke: palette.ink, width: 0.75, alpha: 0.55 * alpha });
    const lit = frame.highlight === index ? 1 : clamp(1 - Math.hypot((a.x + b.x) / 2 - lightX, (a.y + b.y) / 2 - lightY) / reach, 0, 1);
    if (lit > 0.02) out.push({ kind: "line", points: flat([a, b]), stroke: palette.pulse, width: 1.25, alpha: lit * 0.9 * alpha });
  });

  // Registration ticks past each corner, as on a technical drawing.
  const tick = plate.size * 0.05;
  for (const [cx, cz] of [[-s, -s], [s, -s], [s, s], [-s, s]] as const) {
    const from = project([cx, top, cz]);
    out.push({ kind: "line", points: flat([from, project([cx + Math.sign(cx) * tick, top, cz])]), stroke: palette.ink, width: 0.75, alpha: 0.5 * alpha });
    out.push({ kind: "line", points: flat([from, project([cx, top, cz + Math.sign(cz) * tick])]), stroke: palette.ink, width: 0.75, alpha: 0.5 * alpha });
  }
  return corners;
}

function drawPlateContents(ctx: Context, index: number, top: number, alpha: number, flashes: ReturnType<typeof collectFlashes>): void {
  const { model, frame, palette, project, out } = ctx;

  model.traces.forEach((trace, t) => {
    if (trace.plate !== index) return;
    const points = flat(trace.points.map(([x, z]) => project([x, top + 0.003, z])));
    out.push({ kind: "line", points, stroke: palette.ink, width: 0.75, alpha: 0.32 * alpha });
    const flash = flashes.traces.get(t);
    if (flash !== undefined) out.push({ kind: "line", points, stroke: palette.pulse, width: 1.25, alpha: (1 - flash) * 0.6 * alpha });
  });

  for (const ring of flashes.rings[index]) {
    const r = mix(0.08, 0.45, ring.k);
    const circle = Array.from({ length: 20 }, (_, k) => {
      const a = (k / 20) * Math.PI * 2;
      return project([ring.x + Math.cos(a) * r, top + 0.004, ring.z + Math.sin(a) * r]);
    });
    out.push({ kind: "poly", points: flat(circle), stroke: palette.pulse, width: 1, alpha: (1 - ring.k) * 0.9 * alpha });
  }

  const boxes = model.plates[index].boxes
    .map((box) => ({ box, depth: project([box.x, top, box.z]).depth }))
    .sort((a, b) => b.depth - a.depth);
  for (const { box } of boxes) {
    const reach = Math.max(box.w, box.d);
    const glow = flashes.rings[index].reduce((g, f) => (Math.hypot(f.x - box.x, f.z - box.z) < reach ? Math.max(g, 1 - f.k) : g), 0);
    drawBox(ctx, [box.x, top, box.z], [box.w, box.h, box.d], palette.tones[box.tone], alpha, glow * 0.55);
  }

  if (!frame.pulses) return;
  for (const pulse of model.pulses) {
    if (pulse.on !== "trace" || model.traces[pulse.index].plate !== index) continue;
    const { travel } = pulseState(pulse, frame.time);
    if (travel === undefined) continue;
    drawPulse(ctx, model.traces[pulse.index].points.map(([x, z]) => [x, top + 0.006, z] as Vec3), travel, alpha);
  }
}

function drawRisers(ctx: Context, index: number, heights: number[], alpha: number, flashes: ReturnType<typeof collectFlashes>): void {
  const { model, frame, palette, project, out } = ctx;
  if (index === 0) return;
  const half = model.thickness / 2;
  model.risers.forEach((riser, r) => {
    if (riser.from !== index) return;
    const path: Vec3[] = [[riser.x, heights[index] + half, riser.z], [riser.x, heights[index - 1] - half, riser.z]];
    const ends = path.map(project);
    out.push({ kind: "line", points: flat(ends), stroke: palette.ink, width: 0.75, alpha: 0.28 * alpha });
    out.push({ kind: "dot", x: ends[0].x, y: ends[0].y, r: 1.6, fill: palette.ink, alpha: 0.6 * alpha });
    const flash = flashes.risers.get(r);
    if (flash !== undefined) out.push({ kind: "line", points: flat(ends), stroke: palette.pulse, width: 1.25, alpha: (1 - flash) * 0.5 * alpha });
    if (!frame.pulses) return;
    for (const pulse of model.pulses) {
      if (pulse.on !== "riser" || pulse.index !== r) continue;
      const { travel } = pulseState(pulse, frame.time);
      if (travel !== undefined) drawPulse(ctx, path, travel, alpha);
    }
  });
}

export function render(model: SceneModel, frame: Frame, view: Viewport, palette: Palette): SceneOutput {
  const ctx: Context = {
    model,
    frame,
    view,
    palette,
    project: projector(frame, view),
    toView: viewTransform(frame.yaw, frame.pitch),
    out: [],
  };
  const heights = plateHeights(model, frame.spread);
  const half = model.thickness / 2;
  const anchors: { x: number; y: number }[] = [];
  const flashes = collectFlashes(model, frame);

  // Nearer plates are drawn stronger, which reads as atmospheric depth.
  const depths = heights.map((y) => ctx.project([0, y, 0]).depth);
  const near = Math.min(...depths);
  const far = Math.max(...depths) + model.plates[0].size;
  const fog = (depth: number) => mix(1, 0.5, clamp((depth - near) / Math.max(far - near, 0.001), 0, 1));

  // The camera looks down, so plates are painted from the bottom up.
  for (let i = model.plates.length - 1; i >= 0; i--) {
    const plate = model.plates[i];
    const top = heights[i] + half;
    const alpha = fog(depths[i]);
    drawBox(ctx, [0, heights[i] - half, 0], [plate.size, model.thickness, plate.size], palette.tones.plate, palette.plateAlpha * alpha);
    const corners = drawPlateSurface(ctx, i, top, alpha);
    drawPlateContents(ctx, i, top, alpha, flashes);
    if (model.labels) {
      const left = corners.reduce((a, b) => (b.x < a.x ? b : a));
      ctx.out.push({ kind: "text", x: left.x - 10, y: left.y + 4, text: String(i + 1).padStart(2, "0"), fill: palette.muted, alpha });
    }
    anchors[i] = corners.reduce((a, b) => (b.x > a.x ? b : a));
    drawRisers(ctx, i, heights, alpha, flashes);
  }

  return { primitives: ctx.out, anchors };
}
