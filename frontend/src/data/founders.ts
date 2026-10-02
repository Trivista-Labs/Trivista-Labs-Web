import type { ImageMetadata } from "astro";
import dulaj from "../assets/founders/dulaj.jpg";
import esala from "../assets/founders/esala.jpg";
import umesh from "../assets/founders/umesh.jpg";

export type Founder = {
  readonly name: string;
  readonly role: string;
  readonly title: string;
  readonly focus: string;
  readonly photo: ImageMetadata;
  readonly linkedin?: string;
};

// Roles and titles come from the original site. The focus lines restate those titles
// and should be replaced with real bios.
export const founders: readonly Founder[] = [
  {
    name: "Esala Gamage",
    role: "CEO",
    title: "Chief Executive & Engineer",
    focus: "Leads the company and its engineering direction.",
    photo: esala,
    linkedin: "https://www.linkedin.com/in/esala-gamage/",
  },
  {
    name: "Umesh Isuranga",
    role: "CTO",
    title: "Lead Systems Architect",
    focus: "Leads system architecture and technical decisions.",
    photo: umesh,
    linkedin: "https://www.linkedin.com/in/umesh-isuranga/",
  },
  {
    name: "Dulaj Yuthsara",
    role: "COO",
    title: "Hardware & Operations Lead",
    focus: "Leads hardware engineering and day-to-day operations.",
    photo: dulaj,
    linkedin: "https://www.linkedin.com/in/dulaj-yuthsara-9b0a0b338/",
  },
];

/** Shown only in draft previews, as a checklist for the founders. */
export const founderDetailsMissing: readonly string[] = [
  "A two or three sentence bio for each founder",
  "Portraits on a plain background, to replace the composited photos",
];
