/* folded-paper-title: A title appears on layered paper planes whose folds catch the light one after another. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "folded-paper-title",
  name: "Folded Paper Title",
  category: "lettering",
  note: "A title appears on layered paper planes whose folds catch the light one after another.",
  tags: ["lettering","letter","paper","animated","ascii-art"],
  cols: 88,
  rows: 26,
  fps: 24,
  palette: palette([
    hsl(42, 46, 8),
    hsl(51, 42, 17),
    hsl(58, 42, 28),
    hsl(62, 48, 42),
    hsl(67, 58, 57),
    hsl(73, 70, 73),
    hsl(220, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "letter", form: "paper", seed: 2509 });
}
