export type ProcessStep = {
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
};

// The six stages from the redesign brief. Founders to confirm the wording matches practice.
export const processSteps: readonly ProcessStep[] = [
  {
    title: "Discover",
    summary: "Understand the problem, the people involved and the constraints.",
    detail: "We start with the problem: how things work today, what needs to change and who it affects.",
  },
  {
    title: "Design",
    summary: "Shape the product, its workflows and its data.",
    detail: "We shape the product, its workflows and its data before building, while decisions are still cheap to change.",
  },
  {
    title: "Engineer",
    summary: "Build the system on a foundation that stays maintainable.",
    detail: "We build the system on a structure chosen to stay maintainable as it grows.",
  },
  {
    title: "Validate",
    summary: "Test against real requirements before launch.",
    detail: "We test against real requirements and realistic data before anything goes live.",
  },
  {
    title: "Deploy",
    summary: "Launch reliably, with a plan for the switch-over.",
    detail: "We plan the launch so it goes smoothly for your team and your customers.",
  },
  {
    title: "Evolve",
    summary: "Improve the system based on how it is actually used.",
    detail: "We improve the system based on how people actually use it once it is live.",
  },
];
