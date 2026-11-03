/* elastic-membrane-pulse: A membrane absorbs a travelling pulse and releases it as a soft field of concentric folds. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "elastic-membrane-pulse",
  name: "Elastic Membrane Pulse",
  category: "motion-lab",
  note: "A membrane absorbs a travelling pulse and releases it as a soft field of concentric folds.",
  tags: ["motion-lab","field","membrane","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(216, 46, 8),
    hsl(225, 42, 17),
    hsl(232, 42, 28),
    hsl(236, 48, 42),
    hsl(241, 58, 57),
    hsl(247, 70, 73),
    hsl(34, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "membrane", seed: 2990 });
}
