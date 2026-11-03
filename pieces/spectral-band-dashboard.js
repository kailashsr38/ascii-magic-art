/* spectral-band-dashboard: A spectral display separates low, middle and high energy into a precise, moving band map. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "spectral-band-dashboard",
  name: "Spectral Band Dashboard",
  category: "live-data",
  note: "A spectral display separates low, middle and high energy into a precise, moving band map.",
  tags: ["live-data","chart","spectrum","animated","ascii-art"],
  cols: 90,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(280, 46, 8),
    hsl(289, 42, 17),
    hsl(296, 42, 28),
    hsl(300, 48, 42),
    hsl(305, 58, 57),
    hsl(311, 70, 73),
    hsl(98, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "chart", form: "spectrum", seed: 2065 });
}
