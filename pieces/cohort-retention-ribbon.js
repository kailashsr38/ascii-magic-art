/* cohort-retention-ribbon: A cohort chart turns successive return rates into a layered ribbon that slowly settles into view. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "cohort-retention-ribbon",
  name: "Cohort Retention Ribbon",
  category: "live-data",
  note: "A cohort chart turns successive return rates into a layered ribbon that slowly settles into view.",
  tags: ["live-data","chart","cohort","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(320, 46, 8),
    hsl(329, 42, 17),
    hsl(336, 42, 28),
    hsl(340, 48, 42),
    hsl(345, 58, 57),
    hsl(351, 70, 73),
    hsl(138, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "chart", form: "cohort", seed: 2139 });
}
