import { describe, expect, it } from "vitest";
import { PENROSE_FACES, PENROSE_VIEWBOX } from "../../src/data/brand";
import { plateHeights, pointAlong, projector, pulseState, render, viewTransform, type Frame } from "../../src/lib/scene";
import { LIGHT_PALETTE, SCENES, STACK_SCENE, toSvgMarkup } from "../../src/lib/scenes";

const VIEW = { width: 600, height: 600, zoom: 2.35, distance: 12 };
const POSE: Frame = SCENES.stack.pose.frame;

describe("viewTransform", () => {
  it("leaves points alone when the camera is level and facing forward", () => {
    const [x, y, z] = viewTransform(0, 0)([1, 2, 3]);
    expect([x, y, z].map((n) => Math.round(n * 1e6) / 1e6)).toEqual([1, 2, 3]);
  });
});

describe("projector", () => {
  const project = projector({ yaw: 0, pitch: 0.4 }, VIEW);

  it("puts the origin in the middle of the viewport", () => {
    const p = project([0, 0, 0]);
    expect(p.x).toBeCloseTo(300);
    expect(p.y).toBeCloseTo(300);
  });

  it("draws higher points higher on the screen", () => {
    expect(project([0, 1, 0]).y).toBeLessThan(project([0, 0, 0]).y);
  });

  it("looks down, so the far side of a floor appears above the near side", () => {
    expect(project([0, 0, 2]).y).toBeLessThan(project([0, 0, -2]).y);
    expect(project([0, 0, 2]).depth).toBeGreaterThan(project([0, 0, -2]).depth);
  });
});

describe("plateHeights", () => {
  it("stacks plates from the top down, centred on zero", () => {
    const heights = plateHeights(STACK_SCENE, 0);
    expect(heights).toHaveLength(4);
    expect(heights[0]).toBeGreaterThan(heights[3]);
    expect(heights[0] + heights[3]).toBeCloseTo(0);
  });

  it("spreads the plates apart as the scene explodes", () => {
    const closed = plateHeights(STACK_SCENE, 0);
    const open = plateHeights(STACK_SCENE, 1);
    expect(open[0] - open[1]).toBeGreaterThan(closed[0] - closed[1]);
  });
});

describe("pulseState", () => {
  const pulse = { on: "trace" as const, index: 0, phase: 0, speed: 0.5 };

  it("travels, then flashes on arrival, then rests", () => {
    expect(pulseState(pulse, 0)).toEqual({ travel: 0 });
    // At 0.5 cycles a second, a cycle takes 2 s: travel, a flash from about 1.2 s, then rest.
    expect(pulseState(pulse, 1.3).flash).toBeGreaterThan(0);
    expect(pulseState(pulse, 1.8)).toEqual({});
  });

  it("repeats every cycle", () => {
    expect(pulseState(pulse, 0.5).travel).toBeCloseTo(pulseState(pulse, 2.5).travel ?? -1);
  });
});

describe("pointAlong", () => {
  it("measures progress by length along the path", () => {
    const path = [[0, 0, 0], [2, 0, 0], [2, 0, 2]] as const;
    expect(pointAlong(path, 0)).toEqual([0, 0, 0]);
    expect(pointAlong(path, 0.5)).toEqual([2, 0, 0]);
    expect(pointAlong(path, 1)).toEqual([2, 0, 2]);
  });
});

describe("render", () => {
  const still = render(STACK_SCENE, POSE, VIEW, LIGHT_PALETTE);

  it("returns a callout anchor for every plate", () => {
    expect(still.anchors).toHaveLength(4);
    // Plates higher in the stack sit higher on the screen.
    expect(still.anchors[0].y).toBeLessThan(still.anchors[3].y);
  });

  it("produces only finite coordinates inside a sensible area", () => {
    for (const p of still.primitives) {
      const coords = p.kind === "poly" || p.kind === "line" ? p.points : [p.x, p.y];
      for (const n of coords) {
        expect(Number.isFinite(n)).toBe(true);
        expect(Math.abs(n)).toBeLessThan(1200);
      }
    }
  });

  it("draws no pulses in the still poster, and some when animated", () => {
    const pulseDots = (frame: Frame) =>
      render(STACK_SCENE, frame, VIEW, LIGHT_PALETTE).primitives.filter(
        (p) => p.kind === "dot" && p.fill === LIGHT_PALETTE.pulse
      ).length;
    expect(pulseDots(POSE)).toBe(0);
    expect(pulseDots({ ...POSE, pulses: true, time: 1.3 })).toBeGreaterThan(0);
  });

  it("culls hidden faces, so each box shows at most three", () => {
    const boxes = STACK_SCENE.plates.reduce((n, plate) => n + plate.boxes.length + 1, 0);
    const faces = still.primitives.filter((p) => p.kind === "poly" && p.fill !== undefined && p.fill !== LIGHT_PALETTE.pulse).length;
    expect(faces).toBeLessThanOrEqual(boxes * 3);
    expect(faces).toBeGreaterThanOrEqual(boxes * 2);
  });

  it("serialises to SVG elements", () => {
    const svg = toSvgMarkup(still.primitives);
    expect(svg.startsWith("<")).toBe(true);
    expect(svg).toContain("<polygon");
    expect(svg).toContain('class="scene-label">01</text>');
    expect(svg).not.toContain("NaN");
  });
});

describe("the Trivista mark", () => {
  it("has three faces in each of its three bands, inside the view box", () => {
    for (const band of ["teal", "dark", "light"]) {
      expect(PENROSE_FACES.filter((face) => face.band === band)).toHaveLength(3);
    }
    for (const [x, y] of PENROSE_FACES.flatMap((face) => face.points)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(PENROSE_VIEWBOX.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(PENROSE_VIEWBOX.height);
    }
  });
});
