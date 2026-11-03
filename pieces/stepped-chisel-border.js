/* stepped-chisel-border: A stepped stone border is carved by passing light, revealing fine crosshatched corners. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "stepped-chisel-border",
  name: "Stepped Chisel Border",
  category: "frames",
  note: "A stepped stone border is carved by passing light, revealing fine crosshatched corners.",
  tags: ["frames","frame","chisel","animated","ascii-art"],
  cols: 92,
  rows: 18,
  fps: 24,
  palette: palette([
    hsl(32, 46, 8),
    hsl(41, 42, 17),
    hsl(48, 42, 28),
    hsl(52, 48, 42),
    hsl(57, 58, 57),
    hsl(63, 70, 73),
    hsl(210, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "frame", form: "chisel", seed: 4026 });
}
