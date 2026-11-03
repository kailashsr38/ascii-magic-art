/* tideglass-cavern: A hidden sea cave catches a moving blade of turquoise light while the tide draws silver lines across the stone. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "tideglass-cavern",
  name: "Tideglass Cavern",
  category: "landscapes",
  note: "A hidden sea cave catches a moving blade of turquoise light while the tide draws silver lines across the stone.",
  tags: ["landscapes","landscape","cavern","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(188, 46, 8),
    hsl(197, 42, 17),
    hsl(204, 42, 28),
    hsl(208, 48, 42),
    hsl(213, 58, 57),
    hsl(219, 70, 73),
    hsl(6, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "landscape", form: "cavern", seed: 1103 });
}
