/* ant-colony-shortest-path: Ant trails reinforce efficient routes between a nest and several food sources. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "ant-colony-shortest-path",
  name: "Ant Colony Shortest Path",
  category: "algorithms",
  note: "Ant trails reinforce efficient routes between a nest and several food sources.",
  tags: ["algorithms","fractal","ants","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(108, 46, 8),
    hsl(117, 42, 17),
    hsl(124, 42, 28),
    hsl(128, 48, 42),
    hsl(133, 58, 57),
    hsl(139, 70, 73),
    hsl(286, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "fractal", form: "ants", seed: 3545 });
}
