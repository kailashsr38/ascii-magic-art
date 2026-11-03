/* photosphere-magnetic-arc: Magnetic loops rise from a granular stellar surface, joining bright footpoints across the corona. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "photosphere-magnetic-arc",
  name: "Photosphere Magnetic Arc",
  category: "science",
  note: "Magnetic loops rise from a granular stellar surface, joining bright footpoints across the corona.",
  tags: ["science","field","magnetic-arc","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(12, 46, 8),
    hsl(21, 42, 17),
    hsl(28, 42, 28),
    hsl(32, 48, 42),
    hsl(37, 58, 57),
    hsl(43, 70, 73),
    hsl(190, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "magnetic-arc", seed: 4470 });
}
