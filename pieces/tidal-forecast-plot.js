/* tidal-forecast-plot: A tidal prediction compares observed water levels with a shifting forecast band. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "tidal-forecast-plot",
  name: "Tidal Forecast Plot",
  category: "live-data",
  note: "A tidal prediction compares observed water levels with a shifting forecast band.",
  tags: ["live-data","chart","tide","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(188, 46, 8),
    hsl(197, 42, 17),
    hsl(204, 42, 28),
    hsl(208, 48, 42),
    hsl(213, 58, 57),
    hsl(219, 70, 73),
    hsl(6, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "chart", form: "tide", seed: 1991 });
}
