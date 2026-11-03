/* manta-ray-silhouette: A manta ray glides through open water, its broad fins moving in a slow, graceful rhythm. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "manta-ray-silhouette",
  name: "Manta Ray Silhouette",
  category: "animals",
  note: "A manta ray glides through open water, its broad fins moving in a slow, graceful rhythm.",
  tags: ["animals","animal","manta","animated","ascii-art"],
  cols: 88,
  rows: 30,
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
  return createAtelier(meta, { kind: "animal", form: "manta", seed: 3175 });
}
