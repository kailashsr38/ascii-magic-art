/* star-map-perimeter: A slim perimeter frame connects small stars into a moving constellation border. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "star-map-perimeter",
  name: "Star Map Perimeter",
  category: "frames",
  note: "A slim perimeter frame connects small stars into a moving constellation border.",
  tags: ["frames","frame","starmap","animated","ascii-art"],
  cols: 92,
  rows: 18,
  fps: 24,
  palette: palette([
    hsl(238, 46, 8),
    hsl(247, 42, 17),
    hsl(254, 42, 28),
    hsl(258, 48, 42),
    hsl(263, 58, 57),
    hsl(269, 70, 73),
    hsl(56, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "frame", form: "starmap", seed: 3989 });
}
