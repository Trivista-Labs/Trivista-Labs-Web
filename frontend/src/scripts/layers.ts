// The phone version of the hero stack's annotations. On wide screens the layer labels sit beside
// the drawing with callout lines; on phones there is no room, so each plate carries a numbered
// hotspot and the chosen layer is explained in a panel below the drawing.
// The selection is shared with scene.ts through data-active-layer and a "layerchange" event.

// Must match the width in StackDiagram.astro where the labels move beside the drawing.
const PHONE = "(max-width: 39.99em)";

function initLayers(figure: HTMLElement): void {
  const hotspots = Array.from(figure.querySelectorAll<HTMLButtonElement>("[data-layer-hotspot]"));
  const items = Array.from(figure.querySelectorAll<HTMLElement>("[data-layer-item]"));
  const hotspotLayer = figure.querySelector<HTMLElement>("[data-layer-hotspots]");
  const focus = figure.querySelector<HTMLElement>("[data-layer-focus]");
  const next = figure.querySelector<HTMLButtonElement>("[data-layer-next]");
  if (!hotspotLayer || !focus || hotspots.length === 0 || items.length !== hotspots.length) return;

  // Start at the plates' positions in the still drawing; scene.ts moves them once it is live.
  for (const hotspot of hotspots) {
    hotspot.style.left = `${hotspot.dataset.x}%`;
    hotspot.style.top = `${hotspot.dataset.y}%`;
  }

  let current = 0;
  const select = (index: number) => {
    current = (index + items.length) % items.length;
    hotspots.forEach((hotspot, i) => hotspot.setAttribute("aria-pressed", String(i === current)));
    items.forEach((item, i) => (item.hidden = i !== current));
    figure.dataset.activeLayer = String(current);
    figure.dispatchEvent(new Event("layerchange"));
  };

  hotspots.forEach((hotspot, i) => hotspot.addEventListener("click", () => select(i)));
  next?.addEventListener("click", () => select(current + 1));

  const phone = matchMedia(PHONE);
  const apply = () => {
    const on = phone.matches;
    figure.classList.toggle("is-switchable", on);
    hotspotLayer.hidden = !on;
    focus.hidden = !on;
    if (on) {
      select(current);
    } else {
      delete figure.dataset.activeLayer;
      figure.dispatchEvent(new Event("layerchange"));
    }
  };
  phone.addEventListener("change", apply);
  apply();
}

document.querySelectorAll<HTMLElement>("[data-layers]").forEach(initLayers);

// A module, so it can be loaded with import() only on pages that have the stack.
export {};
