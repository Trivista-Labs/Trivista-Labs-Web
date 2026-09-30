import { track } from "../lib/analytics";

// Must match the breakpoint in SiteHeader.astro where the desktop navigation appears.
const DESKTOP = "(min-width: 60em)";

function initNavigation(): void {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const toggle = header?.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const fallback = header?.querySelector<HTMLAnchorElement>("[data-nav-fallback]");
  const menu = header?.querySelector<HTMLElement>("[data-nav-menu]");
  const label = toggle?.querySelector<HTMLElement>("[data-nav-label]");
  if (!header || !toggle || !menu) return;

  // Without JavaScript the "Menu" link jumps to the footer navigation.
  // With it, swap in a real disclosure button.
  toggle.hidden = false;
  if (fallback) fallback.hidden = true;

  const setOpen = (open: boolean) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    if (label) label.textContent = open ? "Close" : "Menu";
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  });

  window.matchMedia(DESKTOP).addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

function initClickTracking(): void {
  document.addEventListener("click", (event) => {
    const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-track]") : null;
    const name = element?.dataset.track;
    if (!element || !name) return;
    const location = element.dataset.trackLocation;
    track(name, location ? { location } : undefined);
  });
}

initNavigation();
initClickTracking();
