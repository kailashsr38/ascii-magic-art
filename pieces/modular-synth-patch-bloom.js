/* modular-synth-patch-bloom: A modular patch lights its signal path as control voltages ripple between oscillators and filters. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "modular-synth-patch-bloom",
  name: "Modular Synth Patch Bloom",
  category: "music",
  note: "A modular patch lights its signal path as control voltages ripple between oscillators and filters.",
  tags: ["music","music","modular","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(276, 46, 8),
    hsl(285, 42, 17),
    hsl(292, 42, 28),
    hsl(296, 48, 42),
    hsl(301, 58, 57),
    hsl(307, 70, 73),
    hsl(94, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "music", form: "modular", seed: 4544 });
}
