/* latency-river: A flowing latency trace separates bursts, quiet stretches and the long tail of slow requests. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "latency-river",
  name: "Latency River",
  category: "live-data",
  note: "A flowing latency trace separates bursts, quiet stretches and the long tail of slow requests.",
  tags: ["live-data","chart","latency","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(194, 46, 8),
    hsl(203, 42, 17),
    hsl(210, 42, 28),
    hsl(214, 48, 42),
    hsl(219, 58, 57),
    hsl(225, 70, 73),
    hsl(12, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "chart", form: "latency", seed: 1954 });
}
