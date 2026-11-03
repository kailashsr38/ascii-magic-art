/* resource-heat-strip: A compact heat strip reveals how memory, compute and storage usage move through a day. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "resource-heat-strip",
  name: "Resource Heat Strip",
  category: "live-data",
  note: "A compact heat strip reveals how memory, compute and storage usage move through a day.",
  tags: ["live-data","chart","heat","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(332, 46, 8),
    hsl(341, 42, 17),
    hsl(348, 42, 28),
    hsl(352, 48, 42),
    hsl(357, 58, 57),
    hsl(3, 70, 73),
    hsl(150, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "chart", form: "heat", seed: 2028 });
}
