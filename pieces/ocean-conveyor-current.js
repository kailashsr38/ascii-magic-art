/* ocean-conveyor-current: A cross-section follows warm surface water and cold deep currents around an ocean basin. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "ocean-conveyor-current",
  name: "Ocean Conveyor Current",
  category: "explainers",
  note: "A cross-section follows warm surface water and cold deep currents around an ocean basin.",
  tags: ["explainers","diagram","current","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(198, 46, 8),
    hsl(207, 42, 17),
    hsl(214, 42, 28),
    hsl(218, 48, 42),
    hsl(223, 58, 57),
    hsl(229, 70, 73),
    hsl(16, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "current", seed: 2213 });
}
