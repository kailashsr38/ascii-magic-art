/* bioluminescent-estuary: A quiet estuary lights in blue-green pulses where the tide turns beneath mangrove roots. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "bioluminescent-estuary",
  name: "Bioluminescent Estuary",
  category: "landscapes",
  note: "A quiet estuary lights in blue-green pulses where the tide turns beneath mangrove roots.",
  tags: ["landscapes","ocean","estuary","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(166, 46, 8),
    hsl(175, 42, 17),
    hsl(182, 42, 28),
    hsl(186, 48, 42),
    hsl(191, 58, 57),
    hsl(197, 70, 73),
    hsl(344, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "ocean", form: "estuary", seed: 1621 });
}
