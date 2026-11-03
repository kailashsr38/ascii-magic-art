/* spring-equinox-paper-kites: Bright kites cross a spring sky while long ribbons answer each change in the wind. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "spring-equinox-paper-kites",
  name: "Spring Equinox Paper Kites",
  category: "occasions",
  note: "Bright kites cross a spring sky while long ribbons answer each change in the wind.",
  tags: ["occasions","festival","equinox","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(36, 46, 8),
    hsl(45, 42, 17),
    hsl(52, 42, 28),
    hsl(56, 48, 42),
    hsl(61, 58, 57),
    hsl(67, 70, 73),
    hsl(214, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "festival", form: "equinox", seed: 4766 });
}
