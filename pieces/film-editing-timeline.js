/* film-editing-timeline: A nonlinear editing desk shows layered picture, sound and colour tracks moving through a cut. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "film-editing-timeline",
  name: "Film Editing Timeline",
  category: "screens",
  note: "A nonlinear editing desk shows layered picture, sound and colour tracks moving through a cut.",
  tags: ["screens","screen","editing","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(274, 46, 8),
    hsl(283, 42, 17),
    hsl(290, 42, 28),
    hsl(294, 48, 42),
    hsl(299, 58, 57),
    hsl(305, 70, 73),
    hsl(92, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "editing", seed: 1843 });
}
