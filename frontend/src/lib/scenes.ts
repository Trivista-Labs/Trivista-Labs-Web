import type { Frame, Palette, Primitive, SceneModel, Viewport } from "./scene";

// The scenes on the site. Box colours reuse the three bands of the Trivista mark.

export const LIGHT_PALETTE: Palette = {
  tones: {
    plate: { top: "#fcfbf8", sideA: "#e6e2d8", sideB: "#d5d0c3", edge: "#d5d0c3" },
    light: { top: "#fdfdfd", sideA: "#efefef", sideB: "#dbdbdb", edge: "#bdb8ac" },
    dark: { top: "#5e5e5e", sideA: "#484848", sideB: "#303030", edge: "#242424" },
    teal: { top: "#24e2c7", sideA: "#16c3b1", sideB: "#14a589", edge: "#0f8a74" },
  },
  plateAlpha: 0.76,
  ink: "#16181a",
  muted: "#676a6c",
  pulse: "#00b89c",
  shadow: "#3a301e",
};

/**
 * The four capability layers, top to bottom: products, operations, devices, infrastructure.
 * Data rises from the infrastructure plate to the products plate.
 */
export const STACK_SCENE: SceneModel = {
  thickness: 0.07,
  gap: [0.56, 1.12],
  labels: true,
  floorShadow: true,
  plates: [
    {
      size: 2.6,
      grid: 6,
      boxes: [
        { x: -0.42, z: 0.28, w: 1.02, d: 0.07, h: 0.64, tone: "light" },
        { x: 0.52, z: -0.3, w: 0.32, d: 0.06, h: 0.58, tone: "teal" },
        { x: 0.62, z: 0.66, w: 0.3, d: 0.3, h: 0.1, tone: "dark" },
      ],
    },
    {
      size: 2.6,
      grid: 6,
      boxes: [
        ...[-0.75, -0.25, 0.25].flatMap((x) =>
          [-0.55, -0.05].map((z) => ({ x, z, w: 0.38, d: 0.38, h: 0.07, tone: "light" as const }))
        ),
        { x: 0.25, z: 0.45, w: 0.38, d: 0.38, h: 0.07, tone: "teal" },
        { x: 0.82, z: 0.62, w: 0.42, d: 0.42, h: 0.32, tone: "dark" },
      ],
    },
    {
      size: 2.6,
      grid: 6,
      boxes: [
        { x: 0.1, z: 0.05, w: 0.84, d: 0.84, h: 0.13, tone: "dark" },
        { x: 0.1, z: 0.05, w: 0.34, d: 0.34, h: 0.2, tone: "teal" },
        { x: -0.82, z: -0.72, w: 0.2, d: 0.2, h: 0.24, tone: "light" },
        { x: 0.88, z: -0.8, w: 0.2, d: 0.2, h: 0.24, tone: "light" },
        { x: -0.86, z: 0.84, w: 0.2, d: 0.2, h: 0.24, tone: "light" },
      ],
    },
    {
      size: 2.6,
      grid: 6,
      boxes: [
        ...[-0.62, -0.18, 0.26].map((x) => ({ x, z: -0.28, w: 0.34, d: 0.62, h: 0.74, tone: "dark" as const })),
        { x: 0.72, z: 0.72, w: 0.5, d: 0.3, h: 0.16, tone: "light" },
      ],
    },
  ],
  risers: [
    { from: 3, x: 0.3, z: 0.95 },
    { from: 3, x: -1.0, z: -0.95 },
    { from: 2, x: -0.95, z: 0.3 },
    { from: 2, x: 0.95, z: 0.95 },
    { from: 1, x: 0.95, z: -0.95 },
    { from: 1, x: -0.95, z: 0.7 },
  ],
  traces: [
    { plate: 3, points: [[-0.18, 0.05], [-0.18, 0.95], [0.3, 0.95]] },
    { plate: 3, points: [[-0.62, -0.62], [-0.62, -0.95], [-1.0, -0.95]] },
    { plate: 2, points: [[0.3, 0.95], [0.3, 0.5], [0.1, 0.5]] },
    { plate: 2, points: [[-0.35, 0.05], [-0.95, 0.05], [-0.95, 0.3]] },
    { plate: 1, points: [[-0.95, 0.3], [-0.95, -0.55], [-0.75, -0.55]] },
    { plate: 1, points: [[0.45, -0.05], [0.95, -0.05], [0.95, -0.95]] },
    { plate: 0, points: [[0.95, -0.95], [0.52, -0.95], [0.52, -0.3]] },
    { plate: 0, points: [[-0.95, 0.7], [-0.95, 0.28], [-0.42, 0.28]] },
  ],
  pulses: [
    { on: "trace", index: 0, phase: 0, speed: 0.24 },
    { on: "riser", index: 0, phase: 0.55, speed: 0.24 },
    { on: "trace", index: 2, phase: 0.1, speed: 0.24 },
    { on: "trace", index: 1, phase: 0.35, speed: 0.2 },
    { on: "riser", index: 1, phase: 0.85, speed: 0.2 },
    { on: "trace", index: 3, phase: 0.6, speed: 0.22 },
    { on: "riser", index: 2, phase: 0.2, speed: 0.22 },
    { on: "trace", index: 4, phase: 0.45, speed: 0.22 },
    { on: "riser", index: 3, phase: 0.7, speed: 0.19 },
    { on: "trace", index: 5, phase: 0.05, speed: 0.26 },
    { on: "riser", index: 4, phase: 0.5, speed: 0.26 },
    { on: "trace", index: 6, phase: 0.9, speed: 0.26 },
    { on: "riser", index: 5, phase: 0.3, speed: 0.21 },
    { on: "trace", index: 7, phase: 0.75, speed: 0.21 },
  ],
};

/** A wide plate seen from above, like a site plan, behind the headers of inner pages. */
export const FIELD_SCENE: SceneModel = {
  thickness: 0.08,
  gap: [0, 0],
  labels: false,
  plates: [
    {
      size: 8,
      grid: 16,
      boxes: [
        { x: -2.5, z: -2, w: 0.45, d: 0.45, h: 0.9, tone: "dark" },
        { x: -2, z: -2, w: 0.45, d: 0.45, h: 0.6, tone: "dark" },
        { x: -1.5, z: -2, w: 0.45, d: 0.45, h: 1.1, tone: "dark" },
        { x: 1.5, z: -2.5, w: 1.5, d: 0.5, h: 0.12, tone: "light" },
        { x: 2.5, z: -1, w: 0.5, d: 0.5, h: 0.35, tone: "teal" },
        { x: 0, z: 0, w: 1, d: 1, h: 0.16, tone: "light" },
        { x: 0, z: 0, w: 0.4, d: 0.4, h: 0.32, tone: "teal" },
        { x: -2.5, z: 1.5, w: 1, d: 0.5, h: 0.25, tone: "light" },
        { x: 1.5, z: 2, w: 0.5, d: 1, h: 0.5, tone: "dark" },
        { x: -0.5, z: 2.5, w: 0.5, d: 0.5, h: 0.2, tone: "light" },
        { x: 3, z: 1.5, w: 0.5, d: 0.5, h: 0.45, tone: "light" },
      ],
    },
  ],
  risers: [],
  traces: [
    { plate: 0, points: [[-1.5, -1.75], [-1.5, -0.5], [-0.5, -0.5], [-0.5, -0.25]] },
    { plate: 0, points: [[0.5, 0], [1.5, 0], [1.5, 1.5]] },
    { plate: 0, points: [[2.5, -0.75], [2.5, -0.25], [0.5, -0.25]] },
    { plate: 0, points: [[-2.5, 1.25], [-2.5, 0.25], [-0.5, 0.25]] },
    { plate: 0, points: [[3, 1.25], [3, 0.75], [1.75, 0.75]] },
    { plate: 0, points: [[0.75, -2.5], [0.25, -2.5], [0.25, -0.5]] },
    { plate: 0, points: [[-0.5, 2.25], [-0.5, 1], [0, 1], [0, 0.5]] },
  ],
  pulses: [
    { on: "trace", index: 0, phase: 0, speed: 0.15 },
    { on: "trace", index: 1, phase: 0.4, speed: 0.18 },
    { on: "trace", index: 2, phase: 0.7, speed: 0.14 },
    { on: "trace", index: 3, phase: 0.2, speed: 0.16 },
    { on: "trace", index: 5, phase: 0.55, speed: 0.13 },
    { on: "trace", index: 6, phase: 0.85, speed: 0.17 },
  ],
};

export interface ScenePose {
  readonly frame: Frame;
  readonly view: Omit<Viewport, "width" | "height">;
  /** How far the cursor can turn the scene, in radians. */
  readonly reach: { readonly yaw: number; readonly pitch: number };
}

export const SCENES = {
  stack: {
    model: STACK_SCENE,
    pose: {
      frame: { time: 0, yaw: Math.PI / 4, pitch: 0.5, spread: 0.6, light: [0.35, -0.5], pulses: false },
      view: { zoom: 2.6, distance: 12, offsetY: 0.01 },
      reach: { yaw: 0.2, pitch: 0.08 },
    },
  },
  field: {
    model: FIELD_SCENE,
    pose: {
      frame: { time: 0, yaw: 0.55, pitch: 0.52, spread: 0, light: [0.3, -0.6], pulses: false },
      view: { zoom: 1.05, distance: 10, offsetX: 0.3, offsetY: 0.1 },
      reach: { yaw: 0.08, pitch: 0.03 },
    },
  },
} as const satisfies Record<string, { model: SceneModel; pose: ScenePose }>;

export type SceneName = keyof typeof SCENES;

const r1 = (n: number) => Math.round(n * 10) / 10;
const pts = (points: number[]) => {
  const pairs: string[] = [];
  for (let i = 0; i < points.length; i += 2) pairs.push(`${r1(points[i])},${r1(points[i + 1])}`);
  return pairs.join(" ");
};
// fill-opacity and stroke-opacity, not opacity: group opacity makes the browser paint each element
// into its own layer, which is slow for drawings with hundreds of elements.
const fade = (alpha: number, attributes: ("fill" | "stroke")[]) =>
  alpha >= 0.995 ? "" : attributes.map((name) => ` ${name}-opacity="${Math.round(alpha * 100) / 100}"`).join("");

/** Serialises primitives as SVG elements, for the poster shown before the canvas takes over. */
export function toSvgMarkup(primitives: readonly Primitive[]): string {
  return primitives
    .map((p) => {
      switch (p.kind) {
        case "poly":
          return `<polygon points="${pts(p.points)}" fill="${p.fill ?? "none"}"${p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.width ?? 1}" stroke-linejoin="round"` : ""}${fade(p.alpha, p.stroke ? ["fill", "stroke"] : ["fill"])}/>`;
        case "line":
          return `<polyline points="${pts(p.points)}" fill="none" stroke="${p.stroke}" stroke-width="${p.width}" stroke-linecap="round" stroke-linejoin="round"${fade(p.alpha, ["stroke"])}/>`;
        case "dot":
          return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${p.r}" fill="${p.fill}"${fade(p.alpha, ["fill"])}/>`;
        case "text":
          return `<text x="${r1(p.x)}" y="${r1(p.y)}" fill="${p.fill}" text-anchor="end" class="scene-label"${fade(p.alpha, ["fill"])}>${p.text}</text>`;
      }
    })
    .join("");
}
