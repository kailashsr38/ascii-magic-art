/* nautilus-night-drift: A nautilus turns through dark water, its chambered shell catching a quiet band of light. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "nautilus-night-drift",
  name: "Nautilus Night Drift",
  category: "animals",
  note: "A nautilus turns through dark water, its chambered shell catching a quiet band of light.",
  tags: ["animals","animal","nautilus","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(196, 46, 8),
    hsl(205, 42, 17),
    hsl(212, 42, 28),
    hsl(216, 48, 42),
    hsl(221, 58, 57),
    hsl(227, 70, 73),
    hsl(14, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "animal", form: "nautilus", seed: 3286 });
}
