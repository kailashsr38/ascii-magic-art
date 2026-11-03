/* crystal-match-cascade: A jewel board resolves a chain reaction as matching crystal clusters fall into new patterns. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "crystal-match-cascade",
  name: "Crystal Match Cascade",
  category: "arcade",
  note: "A jewel board resolves a chain reaction as matching crystal clusters fall into new patterns.",
  tags: ["arcade","arcade","crystal","animated","ascii-art"],
  cols: 88,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(276, 46, 8),
    hsl(285, 42, 17),
    hsl(292, 42, 28),
    hsl(296, 48, 42),
    hsl(301, 58, 57),
    hsl(307, 70, 73),
    hsl(94, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "arcade", form: "crystal", seed: 3878 });
}
