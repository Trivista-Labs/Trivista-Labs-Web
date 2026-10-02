// Words for the careers page. Open roles themselves live in src/content/jobs/.

export type CareerValue = { readonly title: string; readonly text: string };

// Founders to confirm these describe how the team works. Keep them to what is true day to day.
export const careerValues: readonly CareerValue[] = [
  {
    title: "Build with purpose",
    text: "We start from the problem a business has, not from a list of features.",
  },
  {
    title: "Keep learning",
    text: "Technology changes quickly, so we look for people who stay curious and keep learning.",
  },
  {
    title: "Take ownership",
    text: "We value people who think beyond the task in front of them and see their work through to the people who use it.",
  },
  {
    title: "Build together",
    text: "Good products come from engineering, design and business working as one team.",
  },
];

export type HiringArea = { readonly title: string; readonly text: string };

/** Areas the company may hire across in future. None of these is an opening. */
export const hiringAreas: readonly HiringArea[] = [
  { title: "Software engineering", text: "Web, mobile and back-end systems." },
  { title: "Product development", text: "Turning a business problem into something people use." },
  { title: "UI/UX design", text: "Interfaces for customers and for the staff who run a system every day." },
  { title: "Cloud and infrastructure", text: "Networks, servers and cloud systems that stay up." },
  { title: "Cybersecurity", text: "Keeping systems, and the data in them, safe." },
  { title: "Business and sales", text: "Understanding what clients need, and finding the right projects." },
  { title: "Marketing", text: "Explaining what we build, clearly and honestly." },
  { title: "Operations", text: "Keeping projects, people and the company running smoothly." },
];
