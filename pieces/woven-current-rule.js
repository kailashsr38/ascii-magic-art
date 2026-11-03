/* woven-current-rule: Two woven lines cross in a repeating rhythm, their bright threads travelling in opposite directions. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "woven-current-rule",
  name: "Woven Current Rule",
  category: "frames",
  note: "Two woven lines cross in a repeating rhythm, their bright threads travelling in opposite directions.",
  tags: ["frames","frame","woven","animated","ascii-art"],
  cols: 92,
  rows: 18,
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
  return createAtelier(meta, { kind: "frame", form: "woven", seed: 3952 });
}
