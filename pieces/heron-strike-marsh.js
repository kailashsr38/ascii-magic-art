/* heron-strike-marsh: A heron waits among reeds, then folds its neck into a clean strike at the waterline. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "heron-strike-marsh",
  name: "Heron Strike Marsh",
  category: "animals",
  note: "A heron waits among reeds, then folds its neck into a clean strike at the waterline.",
  tags: ["animals","animal","heron","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(92, 46, 8),
    hsl(101, 42, 17),
    hsl(108, 42, 28),
    hsl(112, 48, 42),
    hsl(117, 58, 57),
    hsl(123, 70, 73),
    hsl(270, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "animal", form: "heron", seed: 3212 });
}
