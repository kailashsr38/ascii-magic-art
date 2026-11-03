/* velvet-curve-letterform: A single word bends like velvet ribbon, its illuminated edge travelling across each stroke. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "velvet-curve-letterform",
  name: "Velvet Curve Letterform",
  category: "lettering",
  note: "A single word bends like velvet ribbon, its illuminated edge travelling across each stroke.",
  tags: ["lettering","letter","velvet","animated","ascii-art"],
  cols: 88,
  rows: 26,
  fps: 24,
  palette: palette([
    hsl(316, 46, 8),
    hsl(325, 42, 17),
    hsl(332, 42, 28),
    hsl(336, 48, 42),
    hsl(341, 58, 57),
    hsl(347, 70, 73),
    hsl(134, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "letter", form: "velvet", seed: 2398 });
}
