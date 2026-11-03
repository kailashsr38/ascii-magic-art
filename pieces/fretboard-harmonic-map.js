/* fretboard-harmonic-map: Harmonic nodes travel along a string while fret positions reveal the changing intervals. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "fretboard-harmonic-map",
  name: "Fretboard Harmonic Map",
  category: "music",
  note: "Harmonic nodes travel along a string while fret positions reveal the changing intervals.",
  tags: ["music","music","fretboard","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(218, 46, 8),
    hsl(227, 42, 17),
    hsl(234, 42, 28),
    hsl(238, 48, 42),
    hsl(243, 58, 57),
    hsl(249, 70, 73),
    hsl(36, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "music", form: "fretboard", seed: 4507 });
}
