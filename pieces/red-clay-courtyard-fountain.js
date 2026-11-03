/* red-clay-courtyard-fountain: A tiled courtyard fountain ripples beneath warm plaster walls and climbing jasmine. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "red-clay-courtyard-fountain",
  name: "Red Clay Courtyard Fountain",
  category: "landscapes",
  note: "A tiled courtyard fountain ripples beneath warm plaster walls and climbing jasmine.",
  tags: ["landscapes","architecture","fountain","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(20, 46, 8),
    hsl(29, 42, 17),
    hsl(36, 42, 28),
    hsl(40, 48, 42),
    hsl(45, 58, 57),
    hsl(51, 70, 73),
    hsl(198, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "fountain", seed: 1399 });
}
