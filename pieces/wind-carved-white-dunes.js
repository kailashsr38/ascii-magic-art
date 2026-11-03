/* wind-carved-white-dunes: Pale dunes fold into long ribbons as wind combs fine lines across their crests. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "wind-carved-white-dunes",
  name: "Wind-Carved White Dunes",
  category: "landscapes",
  note: "Pale dunes fold into long ribbons as wind combs fine lines across their crests.",
  tags: ["landscapes","landscape","dunes","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(36, 46, 8),
    hsl(45, 42, 17),
    hsl(52, 42, 28),
    hsl(56, 48, 42),
    hsl(61, 58, 57),
    hsl(67, 70, 73),
    hsl(214, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "landscape", form: "dunes", seed: 1584 });
}
