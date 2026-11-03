/* delaunay-mesh-bloom: A moving point cloud resolves into a changing triangulation with luminous circumcentres. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "delaunay-mesh-bloom",
  name: "Delaunay Mesh Bloom",
  category: "algorithms",
  note: "A moving point cloud resolves into a changing triangulation with luminous circumcentres.",
  tags: ["algorithms","fractal","delaunay","animated","ascii-art"],
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
  return createAtelier(meta, { kind: "fractal", form: "delaunay", seed: 3582 });
}
