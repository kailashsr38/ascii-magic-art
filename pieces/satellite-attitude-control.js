/* satellite-attitude-control: A spacecraft corrects its orientation with reaction wheels while a target remains locked in view. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "satellite-attitude-control",
  name: "Satellite Attitude Control",
  category: "explainers",
  note: "A spacecraft corrects its orientation with reaction wheels while a target remains locked in view.",
  tags: ["explainers","diagram","attitude","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(214, 46, 8),
    hsl(223, 42, 17),
    hsl(230, 42, 28),
    hsl(234, 48, 42),
    hsl(239, 58, 57),
    hsl(245, 70, 73),
    hsl(32, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "attitude", seed: 2287 });
}
