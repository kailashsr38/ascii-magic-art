/* coral-polyp-bloom: A coral colony extends its tiny polyps in a current of drifting plankton and filtered light. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "coral-polyp-bloom",
  name: "Coral Polyp Bloom",
  category: "science",
  note: "A coral colony extends its tiny polyps in a current of drifting plankton and filtered light.",
  tags: ["science","diagram","coral","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(14, 46, 8),
    hsl(23, 42, 17),
    hsl(30, 42, 28),
    hsl(34, 48, 42),
    hsl(39, 58, 57),
    hsl(45, 70, 73),
    hsl(192, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "coral", seed: 4396 });
}
