/* cometary-ion-tail: A comet crosses a star field with separate ion and dust tails curving away from the sun. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "cometary-ion-tail",
  name: "Cometary Ion Tail",
  category: "cosmos",
  note: "A comet crosses a star field with separate ion and dust tails curving away from the sun.",
  tags: ["cosmos","orbit","comet","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(208, 46, 8),
    hsl(217, 42, 17),
    hsl(224, 42, 28),
    hsl(228, 48, 42),
    hsl(233, 58, 57),
    hsl(239, 70, 73),
    hsl(26, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "orbit", form: "comet", seed: 2768 });
}
