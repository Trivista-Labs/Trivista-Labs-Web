import { clamp, render, type Frame, type Primitive } from "../lib/scene";
import { LIGHT_PALETTE, SCENES, type SceneName } from "../lib/scenes";

// Brings the SVG posters rendered at build time to life on a canvas.
// "full": cursor-driven, 60 fps. "lite" (phones, touch): self-driven, 30 fps, lower resolution.
// Reduced motion, Save-Data and low-memory devices keep the still poster and do nothing more.

type Tier = "full" | "lite" | "still";

interface NetworkInfo {
  readonly saveData?: boolean;
}

function chooseTier(): Tier {
  const nav = navigator as Navigator & { connection?: NetworkInfo; deviceMemory?: number };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  if (nav.connection?.saveData) return "still";
  if ((nav.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2) return "still";
  if (matchMedia("(max-width: 47.99em), (pointer: coarse)").matches) return "lite";
  return "full";
}

const TAU = Math.PI * 2;
const IDLE_PERIOD = 22;
// How long drawing one frame may take before a device is treated as too slow to animate,
// judged on the median of the first frames.
const FULL_BUDGET_MS = 12;
const LITE_BUDGET_MS = 22;
const FRAME_SAMPLE = 12;
const median = (values: readonly number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const easeInOut = (t: number) => t * t * (3 - 2 * t);

/** Maps poster (viewBox) coordinates onto the page, the way the poster's preserveAspectRatio does. */
function fit(poster: SVGSVGElement, box: DOMRect, canvas: DOMRect) {
  const { width, height } = poster.viewBox.baseVal;
  const aspect = poster.getAttribute("preserveAspectRatio") ?? "xMidYMid meet";
  const scale = aspect.includes("slice")
    ? Math.max(box.width / width, box.height / height)
    : Math.min(box.width / width, box.height / height);
  const align = (axis: "x" | "y") => (aspect.includes(`${axis}Min`) ? 0 : aspect.includes(`${axis}Max`) ? 1 : 0.5);
  return {
    scale,
    x: box.left - canvas.left + (box.width - width * scale) * align("x"),
    y: box.top - canvas.top + (box.height - height * scale) * align("y"),
    width,
    height,
  };
}

function paint(ctx: CanvasRenderingContext2D, primitives: readonly Primitive[], labelFont: string): void {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const p of primitives) {
    ctx.globalAlpha = p.alpha;
    if (p.kind === "dot") {
      ctx.fillStyle = p.fill;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
      continue;
    }
    if (p.kind === "text") {
      ctx.fillStyle = p.fill;
      ctx.font = labelFont;
      ctx.textAlign = "right";
      ctx.fillText(p.text, p.x, p.y);
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(p.points[0], p.points[1]);
    for (let i = 2; i < p.points.length; i += 2) ctx.lineTo(p.points[i], p.points[i + 1]);
    if (p.kind === "line") {
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = p.width;
      ctx.stroke();
      continue;
    }
    ctx.closePath();
    if (p.fill) {
      ctx.fillStyle = p.fill;
      ctx.fill();
    }
    if (p.stroke) {
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = p.width ?? 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

/** Callout lines from each plate to its label, when the label sits to the right of the scene. */
function paintCallouts(
  ctx: CanvasRenderingContext2D,
  anchors: readonly { x: number; y: number }[],
  labels: readonly HTMLElement[],
  canvasBox: DOMRect,
  active: number
): void {
  labels.forEach((label, i) => {
    const anchor = anchors[i];
    if (!anchor) return;
    const box = label.getBoundingClientRect();
    const end = { x: box.left - canvasBox.left - 6, y: box.top - canvasBox.top + box.height / 2 };
    if (end.x < anchor.x + 40) return;
    const on = i === active;
    ctx.globalAlpha = on ? 0.95 : 0.32;
    ctx.strokeStyle = on ? LIGHT_PALETTE.pulse : LIGHT_PALETTE.ink;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = on ? 1.25 : 0.75;
    ctx.beginPath();
    ctx.moveTo(anchor.x + 4, anchor.y);
    ctx.lineTo(anchor.x + 18, anchor.y);
    ctx.lineTo(end.x - 18, end.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(anchor.x + 4, anchor.y, on ? 3 : 2, 0, TAU);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function trackActiveLabel(labels: readonly HTMLElement[]): { current: number; onChange?: () => void } {
  const state: { current: number; onChange?: () => void } = { current: -1 };
  const set = (value: number) => {
    state.current = value;
    state.onChange?.();
  };
  labels.forEach((label, i) => {
    const on = () => set(i);
    const off = () => set(state.current === i ? -1 : state.current);
    label.addEventListener("pointerenter", on);
    label.addEventListener("pointerleave", off);
    label.addEventListener("focus", on);
    label.addEventListener("blur", off);
  });
  return state;
}

function trackPointer(enabled: boolean) {
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!enabled) return pointer;
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.tx = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
      pointer.ty = clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
    },
    { passive: true }
  );
  return pointer;
}

function mount(root: HTMLElement, tier: Tier): void {
  const scene = SCENES[root.dataset.scene as SceneName];
  const poster = root.querySelector<SVGSVGElement>("[data-scene-poster]");
  const surface = root.closest<HTMLElement>("[data-scene-surface]") ?? root;
  if (!scene || !poster) return;

  const canvas = document.createElement("canvas");
  canvas.className = "scene-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  surface.append(canvas);

  const { pose, model } = scene;
  const labels = Array.from(surface.querySelectorAll<HTMLElement>("[data-callout]"));
  // Phone hotspots (layers.ts) ride on the plates they label.
  const hotspots = Array.from(surface.querySelectorAll<HTMLElement>("[data-layer-hotspot]"));
  const chosenLayer = () => (surface.dataset.activeLayer === undefined ? undefined : Number(surface.dataset.activeLayer));
  const active = trackActiveLabel(labels);
  const pointer = trackPointer(tier === "full");
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
  const labelFont = `500 11px ${mono}`;
  const maxRatio = tier === "full" ? 2 : 1.5;
  const minFrameMs = tier === "full" ? 0 : 1000 / 30 - 2;

  let visible = false;
  let running = false;
  let last = 0;
  let clock = 0;
  // Devices that can't draw a frame within budget stop animating and redraw only on scroll.
  const budgetMs = tier === "full" ? FULL_BUDGET_MS : LITE_BUDGET_MS;
  const costs: number[] = [];
  let still = false;

  const drawFrame = (dt: number) => {
    const follow = 1 - Math.exp(-dt * 3.5);
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;

    const box = root.getBoundingClientRect();
    const canvasBox = surface.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio);
    const width = Math.round(canvasBox.width * ratio);
    const height = Math.round(canvasBox.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Scrolling past the scene opens the stack up, like an exploded engineering drawing.
    const scrolled = clamp(-box.top / Math.max(box.height, 1), 0, 1);
    const idle = Math.sin((clock / IDLE_PERIOD) * TAU);
    const drift = tier === "lite" ? Math.sin((clock / 9) * TAU) * 0.6 : 0;
    const frame: Frame = {
      time: clock,
      yaw: pose.frame.yaw + idle * 0.05 + (pointer.x + drift) * pose.reach.yaw,
      pitch: pose.frame.pitch + pointer.y * pose.reach.pitch + scrolled * 0.1,
      spread: pose.frame.spread + easeInOut(scrolled) * (1 - pose.frame.spread),
      light: [pointer.x * 0.9 + drift * 0.5, pointer.y * 0.8 - 0.35],
      pulses: !still,
      highlight: active.current >= 0 ? active.current : chosenLayer(),
    };

    const map = fit(poster, box, canvasBox);
    const out = render(model, frame, { width: map.width, height: map.height, ...pose.view }, LIGHT_PALETTE);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(ratio * map.scale, 0, 0, ratio * map.scale, ratio * map.x, ratio * map.y);
    paint(ctx, out.primitives, labelFont);
    if (hotspots.length && surface.dataset.activeLayer !== undefined) {
      const originX = box.left - canvasBox.left;
      const originY = box.top - canvasBox.top;
      out.markers.forEach((marker, i) => {
        const hotspot = hotspots[i];
        if (!hotspot) return;
        hotspot.style.left = `${((map.x + marker.x * map.scale - originX) / box.width) * 100}%`;
        hotspot.style.top = `${((map.y + marker.y * map.scale - originY) / box.height) * 100}%`;
      });
    }
    if (labels.length) {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const anchors = out.anchors.map((a) => ({ x: map.x + a.x * map.scale, y: map.y + a.y * map.scale }));
      paintCallouts(ctx, anchors, labels, canvasBox, active.current);
    }
    surface.classList.add("is-live");
  };

  const loop = (now: number) => {
    if (!visible || document.hidden || still) {
      running = false;
      return;
    }
    requestAnimationFrame(loop);
    if (minFrameMs && last && now - last < minFrameMs) return;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    clock += dt;

    const started = performance.now();
    drawFrame(dt);
    if (costs.length >= FRAME_SAMPLE) return;
    costs.push(performance.now() - started);
    if (costs.length === FRAME_SAMPLE && median(costs) > budgetMs) {
      still = true;
      surface.dataset.sceneMotion = "paused";
      drawFrame(0);
    }
  };

  const start = () => {
    if (running || still || !visible || document.hidden) return;
    running = true;
    last = 0;
    requestAnimationFrame(loop);
  };

  // In the still mode, scrolling and label focus still update the drawing, one frame at a time.
  let queued = false;
  const redraw = () => {
    if (!still || queued || !visible) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      drawFrame(0);
    });
  };
  window.addEventListener("scroll", redraw, { passive: true });
  window.addEventListener("resize", redraw, { passive: true });
  active.onChange = redraw;
  surface.addEventListener("layerchange", redraw);

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      start();
      redraw();
    },
    { rootMargin: "80px" }
  ).observe(surface);
  document.addEventListener("visibilitychange", start);
}

// Start once the page has painted and the browser is idle; the still poster covers the wait.
// Safari has no requestIdleCallback, whatever the type definitions say.
const whenIdle = (callback: () => void): void => {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(callback, { timeout: 1500 });
  else setTimeout(callback, 300);
};

const roots = document.querySelectorAll<HTMLElement>("[data-scene]");
if (roots.length) {
  const tier = chooseTier();
  if (tier !== "still") whenIdle(() => roots.forEach((root) => mount(root, tier)));
}
