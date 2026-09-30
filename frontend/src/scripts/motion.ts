// Motion and pointer response. Everything here is progressive: without it, or with reduced
// motion, the page is complete and static.

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

const REVEAL = "[data-reveal], [data-reveal-group] > *";
const STAGGER_MS = 80;
const MAX_STAGGER = 5;

function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/**
 * Content below the fold rises into place as it arrives. Nothing on screen at load is ever hidden.
 * The observer's first report says what starts off screen, so nothing is measured by hand: reading
 * positions here would force the browser to lay out sections it is deliberately skipping.
 */
function initReveals(): void {
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const seen = new WeakSet<Element>();

  const hide = (element: HTMLElement) => {
    if (element.hasAttribute("data-inview")) {
      element.classList.add("is-pending");
      return;
    }
    const parent = element.parentElement;
    const index = parent?.hasAttribute("data-reveal-group") ? Array.from(parent.children).indexOf(element) : 0;
    element.style.setProperty("--delay", `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms`);
    element.classList.add("reveal");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const first = !seen.has(element);
        seen.add(element);
        if (entry.isIntersecting) {
          if (!first) element.classList.add("is-inview");
          observer.unobserve(element);
        } else if (first) {
          hide(element);
        }
      }
    },
    { threshold: 0.05 }
  );
  // Sections that animate as a whole, such as the process track, wait for the same signal.
  for (const element of document.querySelectorAll<HTMLElement>(`${REVEAL}, [data-inview]`)) observer.observe(element);
}

const setVars = (element: HTMLElement, vars: Record<string, string>) => {
  for (const [name, value] of Object.entries(vars)) element.style.setProperty(name, value);
};

function relativePointer(event: PointerEvent, element: Element) {
  const box = element.getBoundingClientRect();
  return {
    x: event.clientX - box.left,
    y: event.clientY - box.top,
    nx: ((event.clientX - box.left) / box.width) * 2 - 1,
    ny: ((event.clientY - box.top) / box.height) * 2 - 1,
  };
}

function initPointerEffects(): void {
  if (reduceMotion || !finePointer) return;

  for (const element of document.querySelectorAll<HTMLElement>("[data-spotlight]")) {
    element.addEventListener(
      "pointermove",
      (event) => {
        const p = relativePointer(event, element);
        setVars(element, { "--mx": `${p.x}px`, "--my": `${p.y}px` });
      },
      { passive: true }
    );
  }

  // A card whose whole area is a link listens on the card ([data-tilt-area]), since the link covers it.
  for (const element of document.querySelectorAll<HTMLElement>("[data-tilt]")) {
    const area = element.closest<HTMLElement>("[data-tilt-area]") ?? element;
    area.addEventListener(
      "pointermove",
      (event) => {
        const p = relativePointer(event, element);
        setVars(element, { "--tx": Math.max(-1, Math.min(1, p.nx)).toFixed(3), "--ty": Math.max(-1, Math.min(1, p.ny)).toFixed(3) });
      },
      { passive: true }
    );
    area.addEventListener("pointerleave", () => setVars(element, { "--tx": "0", "--ty": "0" }));
  }

  // Layered artwork shifts with the pointer anywhere in its section, so depth reads from a distance.
  for (const element of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
    const area = element.closest("section") ?? element;
    area.addEventListener(
      "pointermove",
      (event) => {
        const p = relativePointer(event as PointerEvent, area);
        setVars(element, { "--px": p.nx.toFixed(3), "--py": p.ny.toFixed(3) });
      },
      { passive: true }
    );
    area.addEventListener("pointerleave", () => setVars(element, { "--px": "0", "--py": "0" }));
  }
}

const kilobytes = (bytes: number) => `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;

/** Fills [data-measure] panels with what this page actually cost to load, from the browser's own timings. */
function initMeasurements(): void {
  const panel = document.querySelector<HTMLElement>("[data-measure]");
  if (!panel || !("performance" in window)) return;

  const measure = () => {
    const entries = [
      ...performance.getEntriesByType("navigation"),
      ...performance.getEntriesByType("resource"),
    ] as PerformanceResourceTiming[];
    // Cached files report no transfer; their compressed size is the honest figure.
    const size = (entry: PerformanceResourceTiming) => entry.transferSize || entry.encodedBodySize || 0;
    const total = entries.reduce((sum, entry) => sum + size(entry), 0);
    const scripts = entries
      .filter((entry) => entry.initiatorType === "script" || /\.m?js(\?|$)/.test(entry.name))
      .reduce((sum, entry) => sum + size(entry), 0);
    if (total === 0) return;
    const values: Record<string, string> = {
      total: kilobytes(total),
      files: String(entries.length),
      scripts: kilobytes(scripts),
    };
    for (const slot of panel.querySelectorAll<HTMLElement>("[data-measure-value]")) {
      slot.textContent = values[slot.dataset.measureValue ?? ""] ?? slot.textContent;
    }
    panel.hidden = false;
  };

  const later = () => window.setTimeout(measure, 400);
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
}

initHeader();
initReveals();
initPointerEffects();
initMeasurements();
