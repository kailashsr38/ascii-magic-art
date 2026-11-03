/* granular-sand-dune: Thousands of grains settle into a dune whose crest migrates under a steady crosswind. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "granular-sand-dune",
  name: "Granular Sand Dune",
  category: "motion-lab",
  note: "Thousands of grains settle into a dune whose crest migrates under a steady crosswind.",
  tags: ["motion-lab","field","sand","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(32, 46, 8),
    hsl(41, 42, 17),
    hsl(48, 42, 28),
    hsl(52, 48, 42),
    hsl(57, 58, 57),
    hsl(63, 70, 73),
    hsl(210, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "sand", seed: 2842 });
}
