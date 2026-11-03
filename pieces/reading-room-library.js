/* reading-room-library: A quiet digital library arranges reading shelves, annotations and a page in progress. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "reading-room-library",
  name: "Reading Room Library",
  category: "screens",
  note: "A quiet digital library arranges reading shelves, annotations and a page in progress.",
  tags: ["screens","screen","library","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(28, 46, 8),
    hsl(37, 42, 17),
    hsl(44, 42, 28),
    hsl(48, 48, 42),
    hsl(53, 58, 57),
    hsl(59, 70, 73),
    hsl(206, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "library", seed: 1732 });
}
