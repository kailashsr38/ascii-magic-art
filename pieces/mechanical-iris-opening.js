/* mechanical-iris-opening: Overlapping metal leaves rotate apart to reveal a bright aperture at the centre. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "mechanical-iris-opening",
  name: "Mechanical Iris Opening",
  category: "things",
  note: "Overlapping metal leaves rotate apart to reveal a bright aperture at the centre.",
  tags: ["things","object","iris","animated","ascii-art"],
  cols: 88,
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
  return createAtelier(meta, { kind: "object", form: "iris", seed: 3434 });
}
