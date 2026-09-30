// The Trivista mark as vector faces, traced from the original artwork and snapped to its
// 60-degree grid. Each band of the Penrose triangle has a lit face and one or two shaded faces.
export type PenroseBand = "light" | "dark" | "teal";

export interface PenroseFace {
  readonly band: PenroseBand;
  readonly fill: string;
  readonly points: readonly (readonly [number, number])[];
}

export const PENROSE_VIEWBOX = { width: 100, height: 86.6 } as const;

export const PENROSE_FACES: readonly PenroseFace[] = [
  { band: "teal", fill: "#14a589", points: [[21, 21.4], [49.9, 71.7], [41.6, 86.4], [12.5, 36.2]] },
  { band: "teal", fill: "#24e2c7", points: [[21, 21.4], [43.1, 21.4], [49.8, 33], [27.8, 33]] },
  { band: "teal", fill: "#16c3b1", points: [[50, 71.7], [67, 71.7], [58.4, 86.4], [41.6, 86.4]] },
  { band: "dark", fill: "#303030", points: [[50.2, 33], [60.8, 51.7], [53.7, 64.9], [42.9, 46]] },
  { band: "dark", fill: "#484848", points: [[82.7, 14.7], [99.8, 14.7], [70.9, 65], [53.8, 65]] },
  { band: "dark", fill: "#5e5e5e", points: [[74.2, 0], [91.3, 0], [99.8, 14.7], [82.7, 14.7]] },
  { band: "light", fill: "#dbdbdb", points: [[8.8, 0], [17.2, 14.7], [8.8, 29.4], [0.3, 14.7]] },
  { band: "light", fill: "#efefef", points: [[60.7, 14.7], [75, 14.7], [64.5, 33], [50.2, 33]] },
  { band: "light", fill: "#fdfdfd", points: [[8.8, 0], [66.6, 0], [75, 14.7], [17.2, 14.7]] },
];

export const PENROSE_BANDS: readonly PenroseBand[] = ["teal", "dark", "light"];
