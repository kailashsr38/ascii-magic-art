/* pollination-network-map: Flowers and pollinators form a living network as visits travel between blooms. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "pollination-network-map",
  name: "Pollination Network Map",
  category: "explainers",
  note: "Flowers and pollinators form a living network as visits travel between blooms.",
  tags: ["explainers","diagram","pollination","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(96, 46, 8),
    hsl(105, 42, 17),
    hsl(112, 42, 28),
    hsl(116, 48, 42),
    hsl(121, 58, 57),
    hsl(127, 70, 73),
    hsl(274, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "pollination", seed: 2361 });
}
