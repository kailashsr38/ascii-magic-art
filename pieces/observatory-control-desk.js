/* observatory-control-desk: A telescope control workspace aligns a target, exposure window and instrument readouts. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "observatory-control-desk",
  name: "Observatory Control Desk",
  category: "screens",
  note: "A telescope control workspace aligns a target, exposure window and instrument readouts.",
  tags: ["screens","screen","control-desk","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(222, 46, 8),
    hsl(231, 42, 17),
    hsl(238, 42, 28),
    hsl(242, 48, 42),
    hsl(247, 58, 57),
    hsl(253, 70, 73),
    hsl(40, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "control-desk", seed: 1880 });
}
