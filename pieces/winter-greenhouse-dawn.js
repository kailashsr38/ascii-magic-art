/* winter-greenhouse-dawn: A glasshouse glows from within while frost softens the rows of plants beyond its panes. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "winter-greenhouse-dawn",
  name: "Winter Greenhouse Dawn",
  category: "landscapes",
  note: "A glasshouse glows from within while frost softens the rows of plants beyond its panes.",
  tags: ["landscapes","garden","greenhouse","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(174, 46, 8),
    hsl(183, 42, 17),
    hsl(190, 42, 28),
    hsl(194, 48, 42),
    hsl(199, 58, 57),
    hsl(205, 70, 73),
    hsl(352, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "garden", form: "greenhouse", seed: 1214 });
}
