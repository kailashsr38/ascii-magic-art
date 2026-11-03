/* coupled-resonance-plates: Two vibrating plates exchange energy through a narrow bridge, producing shifting nodal lines. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "coupled-resonance-plates",
  name: "Coupled Resonance Plates",
  category: "motion-lab",
  note: "Two vibrating plates exchange energy through a narrow bridge, producing shifting nodal lines.",
  tags: ["motion-lab","field","resonance","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(224, 46, 8),
    hsl(233, 42, 17),
    hsl(240, 42, 28),
    hsl(244, 48, 42),
    hsl(249, 58, 57),
    hsl(255, 70, 73),
    hsl(42, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "resonance", seed: 2879 });
}
