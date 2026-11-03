/* twisted-ribbon-knot: A continuous ribbon twists through itself, exposing a different coloured face at every turn. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "twisted-ribbon-knot",
  name: "Twisted Ribbon Knot",
  category: "solids",
  note: "A continuous ribbon twists through itself, exposing a different coloured face at every turn.",
  tags: ["solids","solid","ribbon","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 30,
  palette: palette([
    hsl(282, 46, 8),
    hsl(291, 42, 17),
    hsl(298, 42, 28),
    hsl(302, 48, 42),
    hsl(307, 58, 57),
    hsl(313, 70, 73),
    hsl(100, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "solid", form: "ribbon", seed: 2620 });
}
