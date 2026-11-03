/* observatory-over-moor: A brass dome turns above a dark moor as a narrow beam searches the last clear patch of sky. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "observatory-over-moor",
  name: "Observatory Over the Moor",
  category: "landscapes",
  note: "A brass dome turns above a dark moor as a narrow beam searches the last clear patch of sky.",
  tags: ["landscapes","architecture","observatory","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(42, 46, 8),
    hsl(51, 42, 17),
    hsl(58, 42, 28),
    hsl(62, 48, 42),
    hsl(67, 58, 57),
    hsl(73, 70, 73),
    hsl(220, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "observatory", seed: 1140 });
}
