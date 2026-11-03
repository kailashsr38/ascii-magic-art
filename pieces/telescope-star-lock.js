/* telescope-star-lock: A brass telescope slews across the sky until a star drifts into the centre of its reticle. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "telescope-star-lock",
  name: "Telescope Star Lock",
  category: "things",
  note: "A brass telescope slews across the sky until a star drifts into the centre of its reticle.",
  tags: ["things","object","telescope","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(212, 46, 8),
    hsl(221, 42, 17),
    hsl(228, 42, 28),
    hsl(232, 48, 42),
    hsl(237, 58, 57),
    hsl(243, 70, 73),
    hsl(30, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "object", form: "telescope", seed: 3508 });
}
