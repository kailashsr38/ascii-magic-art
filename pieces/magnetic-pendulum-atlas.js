/* magnetic-pendulum-atlas: A pendulum traces a changing map of attraction basins above three hidden magnets. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "magnetic-pendulum-atlas",
  name: "Magnetic Pendulum Atlas",
  category: "motion-lab",
  note: "A pendulum traces a changing map of attraction basins above three hidden magnets.",
  tags: ["motion-lab","field","pendulum","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(182, 46, 8),
    hsl(191, 42, 17),
    hsl(198, 42, 28),
    hsl(202, 48, 42),
    hsl(207, 58, 57),
    hsl(213, 70, 73),
    hsl(0, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "pendulum", seed: 2916 });
}
