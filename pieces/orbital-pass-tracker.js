/* orbital-pass-tracker: A pass planner plots an orbit track, horizon window and signal strength across a station horizon. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "orbital-pass-tracker",
  name: "Orbital Pass Tracker",
  category: "live-data",
  note: "A pass planner plots an orbit track, horizon window and signal strength across a station horizon.",
  tags: ["live-data","chart","pass","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(216, 46, 8),
    hsl(225, 42, 17),
    hsl(232, 42, 28),
    hsl(236, 48, 42),
    hsl(241, 58, 57),
    hsl(247, 70, 73),
    hsl(34, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "chart", form: "pass", seed: 2102 });
}
