/* immune-response-sequence: A clear visual sequence follows a cell signal, recognition and a coordinated immune response. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "immune-response-sequence",
  name: "Immune Response Sequence",
  category: "explainers",
  note: "A clear visual sequence follows a cell signal, recognition and a coordinated immune response.",
  tags: ["explainers","diagram","immune","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(342, 46, 8),
    hsl(351, 42, 17),
    hsl(358, 42, 28),
    hsl(2, 48, 42),
    hsl(7, 58, 57),
    hsl(13, 70, 73),
    hsl(160, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "immune", seed: 2250 });
}
