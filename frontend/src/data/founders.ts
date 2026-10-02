import type { ImageMetadata } from "astro";
import dulaj from "../assets/founders/dulaj.jpg";
import esala from "../assets/founders/esala.jpg";
import umesh from "../assets/founders/umesh.jpg";

export type Founder = {
  readonly name: string;
  readonly role: string;
  readonly title: string;
  readonly bio: string;
  readonly photo: ImageMetadata;
  readonly linkedin?: string;
};

// Roles and titles come from the original site; the bios were provided by the founders.
export const founders: readonly Founder[] = [
  {
    name: "Esala Gamage",
    role: "CEO",
    title: "Chief Executive & Engineer",
    bio: "As Chief Executive Officer, Esala leads the team and its software projects, from project management to technical leadership, drawing on expertise in cybersecurity and cloud technologies.",
    photo: esala,
    linkedin: "https://www.linkedin.com/in/esala-gamage/",
  },
  {
    name: "Umesh Isuranga",
    role: "CTO",
    title: "Lead Systems Architect",
    bio: "As Chief Technology Officer, Umesh sets the technical direction: how each system is structured, which technologies it uses, and the standards for security, testing and deployment that the team builds to.",
    photo: umesh,
    linkedin: "https://www.linkedin.com/in/umesh-isuranga/",
  },
  {
    name: "Dulaj Yuthsara",
    role: "COO",
    title: "Hardware & Operations Lead",
    bio: "As Chief Operating Officer, Dulaj brings expertise in React.js, back-end web development and database testing, and focuses on improving how the team works and how it works together.",
    photo: dulaj,
    linkedin: "https://www.linkedin.com/in/dulaj-yuthsara-9b0a0b338/",
  },
];
