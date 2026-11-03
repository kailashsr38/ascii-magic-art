/* capillary-wave-lens: A point of tension sends tiny capillary rings across a shallow pool of reflected light. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "capillary-wave-lens",
  name: "Capillary Wave Lens",
  category: "motion-lab",
  note: "A point of tension sends tiny capillary rings across a shallow pool of reflected light.",
  tags: ["motion-lab","field","capillary","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(194, 46, 8),
    hsl(203, 42, 17),
    hsl(210, 42, 28),
    hsl(214, 48, 42),
    hsl(219, 58, 57),
    hsl(225, 70, 73),
    hsl(12, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "capillary", seed: 2953 });
}
