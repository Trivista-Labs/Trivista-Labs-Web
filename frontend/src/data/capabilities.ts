export const CAPABILITY_IDS = ["products", "business-systems", "hardware-iot", "infrastructure"] as const;
export type CapabilityId = (typeof CAPABILITY_IDS)[number];

export type Capability = {
  readonly id: CapabilityId;
  /** Name used in navigation and labels. */
  readonly label: string;
  /** Short layer name for the hero diagram. */
  readonly layer: string;
  readonly layerDetail: string;
  /** Headline framed around the outcome. */
  readonly title: string;
  /** The business problem this capability answers. */
  readonly problem: string;
  readonly summary: string;
  readonly deliverables: readonly string[];
};

// Confirmed with the founders on 30 September 2026. Summaries follow the wording of the
// original site's service descriptions.
export const capabilities: readonly Capability[] = [
  {
    id: "products",
    label: "Web and mobile apps",
    layer: "Products",
    layerDetail: "Web and mobile apps",
    title: "Products your customers use",
    problem: "Customer-facing software has to work on the first day and keep working as more people use it.",
    summary:
      "We design and build web applications, mobile apps and SaaS platforms, structured for long-term maintainability and performance from the start.",
    deliverables: ["Web applications", "iOS and Android apps", "SaaS platforms", "Custom software"],
  },
  {
    id: "business-systems",
    label: "Business systems",
    layer: "Operations",
    layerDetail: "ERP, booking, inventory",
    title: "Systems that run your operations",
    problem: "When operations live in spreadsheets, paper and memory, errors and delays add up as the business grows.",
    summary: "We build the systems a business runs on every day, shaped around the way your team works.",
    deliverables: ["ERP systems", "Booking and scheduling", "Inventory management", "Dashboards and internal tools"],
  },
  {
    id: "hardware-iot",
    label: "Hardware and IoT",
    layer: "Devices",
    layerDetail: "Hardware and IoT",
    title: "Hardware connected to your software",
    problem: "Equipment that produces data or needs control is only useful once it is connected to the rest of the business.",
    summary:
      "We connect physical hardware with the software that controls it, including IoT systems and custom firmware built to your requirements.",
    deliverables: ["Device integration", "IoT systems", "Custom firmware", "Communication protocols"],
  },
  {
    id: "infrastructure",
    label: "Enterprise IT",
    layer: "Infrastructure",
    layerDetail: "Cloud and IT",
    title: "Infrastructure that stays up",
    problem: "Business systems need to stay available, secure and recoverable, even without a large in-house IT team.",
    summary: "We deploy and manage the infrastructure your systems run on, with secure handling of your data at every layer.",
    deliverables: ["Infrastructure deployment", "Cloud management", "Secure data handling", "Ongoing management"],
  },
];

export const capabilityById = (id: CapabilityId): Capability => {
  const capability = capabilities.find((item) => item.id === id);
  if (!capability) throw new Error(`Unknown capability: ${id}`);
  return capability;
};
