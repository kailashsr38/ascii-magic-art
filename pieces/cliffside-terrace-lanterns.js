/* cliffside-terrace-lanterns: Small lanterns trace a terrace cut into the cliff above a dark, restless inlet. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "cliffside-terrace-lanterns",
  name: "Cliffside Terrace Lanterns",
  category: "landscapes",
  note: "Small lanterns trace a terrace cut into the cliff above a dark, restless inlet.",
  tags: ["landscapes","landscape","terrace","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(28, 46, 8),
    hsl(37, 42, 17),
    hsl(44, 42, 28),
    hsl(48, 48, 42),
    hsl(53, 58, 57),
    hsl(59, 70, 73),
    hsl(206, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "landscape", form: "terrace", seed: 1436 });
}
