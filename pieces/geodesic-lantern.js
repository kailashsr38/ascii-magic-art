/* geodesic-lantern: A geodesic lantern turns slowly, its triangulated shell brightening at the points facing the light. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "geodesic-lantern",
  name: "Geodesic Lantern",
  category: "solids",
  note: "A geodesic lantern turns slowly, its triangulated shell brightening at the points facing the light.",
  tags: ["solids","solid","geodesic","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 30,
  palette: palette([
    hsl(154, 46, 8),
    hsl(163, 42, 17),
    hsl(170, 42, 28),
    hsl(174, 48, 42),
    hsl(179, 58, 57),
    hsl(185, 70, 73),
    hsl(332, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "solid", form: "geodesic", seed: 2657 });
}
