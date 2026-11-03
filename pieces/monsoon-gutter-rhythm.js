/* monsoon-gutter-rhythm: Rainwater pulses through a narrow gutter, overflowing in bright beads against wet stone. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "monsoon-gutter-rhythm",
  name: "Monsoon Gutter Rhythm",
  category: "weather",
  note: "Rainwater pulses through a narrow gutter, overflowing in bright beads against wet stone.",
  tags: ["weather","weather","monsoon","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(204, 46, 8),
    hsl(213, 42, 17),
    hsl(220, 42, 28),
    hsl(224, 48, 42),
    hsl(229, 58, 57),
    hsl(235, 70, 73),
    hsl(22, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "weather", form: "monsoon", seed: 3064 });
}
