/* spectral-graph-partition: A network separates into communities as edge weights relax and the clusters become distinct. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "spectral-graph-partition",
  name: "Spectral Graph Partition",
  category: "algorithms",
  note: "A network separates into communities as edge weights relax and the clusters become distinct.",
  tags: ["algorithms","fractal","partition","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(258, 46, 8),
    hsl(267, 42, 17),
    hsl(274, 42, 28),
    hsl(278, 48, 42),
    hsl(283, 58, 57),
    hsl(289, 70, 73),
    hsl(76, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "fractal", form: "partition", seed: 3619 });
}
