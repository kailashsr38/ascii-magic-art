/* brass-compass-calibration: A compass card settles between cardinal marks as its needle finds true north. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "brass-compass-calibration",
  name: "Brass Compass Calibration",
  category: "things",
  note: "A compass card settles between cardinal marks as its needle finds true north.",
  tags: ["things","object","compass","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(38, 46, 8),
    hsl(47, 42, 17),
    hsl(54, 42, 28),
    hsl(58, 48, 42),
    hsl(63, 58, 57),
    hsl(69, 70, 73),
    hsl(216, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "object", form: "compass", seed: 3397 });
}
