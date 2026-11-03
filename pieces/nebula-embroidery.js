/* nebula-embroidery: A nebula gathers into delicate stitched filaments, with bright knots threaded through the dark. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "nebula-embroidery",
  name: "Nebula Embroidery",
  category: "cosmos",
  note: "A nebula gathers into delicate stitched filaments, with bright knots threaded through the dark.",
  tags: ["cosmos","orbit","nebula","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(292, 46, 8),
    hsl(301, 42, 17),
    hsl(308, 42, 28),
    hsl(312, 48, 42),
    hsl(317, 58, 57),
    hsl(323, 70, 73),
    hsl(110, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "orbit", form: "nebula", seed: 2805 });
}
