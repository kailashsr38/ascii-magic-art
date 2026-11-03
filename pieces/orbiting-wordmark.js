/* orbiting-wordmark: Letters hold their baseline while small glyphs circle them in a slow typographic orbit. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "orbiting-wordmark",
  name: "Orbiting Wordmark",
  category: "lettering",
  note: "Letters hold their baseline while small glyphs circle them in a slow typographic orbit.",
  tags: ["lettering","letter","orbit","animated","ascii-art"],
  cols: 88,
  rows: 26,
  fps: 24,
  palette: palette([
    hsl(268, 46, 8),
    hsl(277, 42, 17),
    hsl(284, 42, 28),
    hsl(288, 48, 42),
    hsl(293, 58, 57),
    hsl(299, 70, 73),
    hsl(86, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "letter", form: "orbit", seed: 2472 });
}
