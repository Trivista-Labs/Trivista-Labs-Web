# Trivista UI DNA

The rules that make a Trivista page recognisable without the logo. Read this before designing a new page or component.

Everything comes from one source, the Trivista mark: a Penrose triangle drawn on a 60-degree grid, made of three bands (light, dark and teal) whose ends are cut at 60 degrees. When a new element needs a shape, angle, rhythm or accent, take it from the mark rather than from a trend.

The styles live in `src/styles/tokens.css` (values) and `src/styles/depth.css` (the shared language).

## 1. Typography

- **Two voices.** Schibsted Grotesk says things; JetBrains Mono labels them. Mono is for metadata only: indexes, layer names, measurements, captions and file names. It is never used for sentences.
- **Headlines are confident and tight.** Negative tracking (`--tracking-display`), a line height near 1, and balanced wrapping (`text-wrap: balance`) on h1 and h2 only.
- **Hierarchy through contrast of scale.** Pair very large text with very small mono metadata, such as the layer index "01" beside a heading, or "Layer 02 of 04" on a drawing. Avoid a smooth ladder of similar sizes.
- **One accent per headline, in solid teal ink.** For example, "runs on." in the hero. No gradient text.
- **Numbers are sheet numbers.** Sections, layers, stages and case-study parts are numbered 01, 02 and so on, like the sheets of a drawing set.

## 2. Shape language

- **Square corners.** Radii are close to zero (`--radius*`).
- **The 60-degree cut** is the signature. Frames (`.tv-frame`) and images (`.tv-cut`) have their top-left and bottom-right corners cut at the angle of the band ends. Set the size with `--cut`: about 9px for small labels, 14–22px for panels and stages.
- **Use it for frames that hold something:** a drawing, a product, a form, an instrument readout. Leave text, lists and rules unframed. Most content should sit on the page, not in a box.

## 3. Borders and rules

- **Hairlines only:** 1px, low contrast (`--rule`, `--line-dark`). Long rules fade out at their ends (`.section--rule`).
- **Frame edges** are drawn by `.tv-frame` and follow the cut. On interactive frames (`.tv-frame--live`), the edge lights teal on hover and focus. That is the Trivista hover.
- **A 2px teal left border** marks live or measured data, such as the "Measured in your browser" block.

## 4. Buttons and links

- **Buttons are bands.** They have a straight start and a trailing end cut at 60 degrees (`.button`), with no radius, no lift and no glow.
- **Button hover is directional.** A teal band travels along the bottom edge, in the direction the button leads. On dark surfaces the fill is teal and the band is ink.
- **Arrow links** (`.link-arrow`) draw their underline from left to right. The arrow glyph (`ArrowIcon.astro`) has square ends and a head at 60 degrees.
- **Labels say what happens,** such as "Start a project" or "See what we build". Avoid "Learn more", "Get started" or "Explore".

## 5. Motion

Motion describes what an element is. Never apply one preset to everything.

| Element | Behaviour |
| --- | --- |
| Section headings | Travel in along the 60-degree axis (`data-reveal="heading"`) |
| Projects | Settle out of perspective (`data-reveal="project"`) |
| Technical readouts | Scan in from left to right (`data-reveal-group="scan"`) |
| Lists and groups | Rise with a short stagger (`data-reveal-group`) |
| Process | A lit track advances stage by stage (`data-inview`) |
| Navigation | A precise underline; the current page keeps a teal one |
| Footer | Still: completion, not performance |

- Only content that starts below the fold is ever hidden, and nothing moves with reduced motion.
- Easing is `--ease-out-expo`, which slows down precisely. No bounce, no springs, no scroll-jacking.
- Hover never scales images or lifts cards. It lights an edge or draws a band.

## 6. 3D

- **Software as architecture.** Plates are layers of a system, boxes stand on them as components, and data moves along traces and risers as pulses. There are no spheres, particles, blobs or floating decoration.
- **One renderer, one palette.** Scenes are defined in `src/lib/scenes.ts` and drawn by `src/lib/scene.ts`. Boxes use the mark's three band palettes: light, dark and teal.
- **Plates carry the isometric lattice,** so the 3D and the page share one geometry.
- **The same objects recur.** The hero stack's plates are the capability drawings on the home and Capabilities pages.
- **Performance.** Every scene has a still SVG made at build time. The live canvas pauses off screen and stops on slow devices.

## 7. Grid and composition

- **Engineered asymmetry.** Layouts use uneven columns (for example 5.5 : 6.5, or 4 : 7) and elements that step across rows, such as the staggered capability drawings and the stepped founder portraits. Things are precise, but not mirrored.
- **Editorial rows, not card grids.** Lists of peers read as rows with large indexes: the layers, the process and the principles.
- **Callouts join labels to what they describe,** as on a technical drawing: the hero's layer labels, and the project screenshots ("01 Public site").

## 8. Iconography

- Line glyphs with square ends and 60-degree angles, drawn at 16px on a 1.5px stroke.
- The tri-band (`.eyebrow::before`) is the one recurring symbol: three slanted segments in the mark's colours. It marks labels, and as `.tv-state` it shows state, with the teal segment lit for live.
- No stock icons: no globes, rockets, lightning bolts, shields or sparkles.

## 9. Light and texture

- **Teal is light, not paint.** It appears as edge light, pulses, the lit segment of a state, and a single soft source in dark sections. It is never a large fill on light surfaces.
- **The isometric lattice** (`--lattice`, `--lattice-dark`) is the only texture. It is barely visible and fades out from a focal point. There is no noise, no glassmorphism and no cursor glow.
- **Dark surfaces are graphite** (`--graphite*`) and step up in value, rather than getting darker shadows.

## 10. Interaction principles

1. The interface should show software thinking through real states and real data (the live measurements, the layer highlight, the process track), never through invented numbers.
2. Every effect needs a reason that could be explained to an engineer.
3. Content is complete without JavaScript, without motion and in print.
4. Accessibility and speed come first: WCAG 2.2 AA, visible focus, and a home page under 10 KB of compressed JavaScript (enforced in `tests/e2e/site.spec.ts`).
5. When unsure, remove the effect.
