/* stellated-prism: A rotating stellated prism throws intersecting edges into a star-like geometric silhouette. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "stellated-prism",
  name: "Stellated Prism",
  category: "solids",
  note: "A rotating stellated prism throws intersecting edges into a star-like geometric silhouette.",
  tags: ["solids","solid","stellated","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 30,
  palette: palette([
    hsl(210, 46, 8),
    hsl(219, 42, 17),
    hsl(226, 42, 28),
    hsl(230, 48, 42),
    hsl(235, 58, 57),
    hsl(241, 70, 73),
    hsl(28, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "solid", form: "stellated", seed: 2546 });
}
