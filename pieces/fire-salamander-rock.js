/* fire-salamander-rock: A small salamander crosses a warm rock while its bright markings pulse in the shade. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "fire-salamander-rock",
  name: "Fire Salamander on Warm Stone",
  category: "animals",
  note: "A small salamander crosses a warm rock while its bright markings pulse in the shade.",
  tags: ["animals","animal","salamander","animated","ascii-art"],
  cols: 88,
  rows: 30,
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
  return createAtelier(meta, { kind: "animal", form: "salamander", seed: 3323 });
}
