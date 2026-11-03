/* chromatic-scanline-orbit: A bright object pulses through offset scanlines while colour bands orbit the centre. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "chromatic-scanline-orbit",
  name: "Chromatic Scanline Orbit",
  category: "demoscene",
  note: "A bright object pulses through offset scanlines while colour bands orbit the centre.",
  tags: ["demoscene","field","scanline","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(288, 46, 8),
    hsl(297, 42, 17),
    hsl(304, 42, 28),
    hsl(308, 48, 42),
    hsl(313, 58, 57),
    hsl(319, 70, 73),
    hsl(106, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "scanline", seed: 3767 });
}
