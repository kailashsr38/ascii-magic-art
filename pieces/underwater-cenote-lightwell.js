/* underwater-cenote-lightwell: A shaft of daylight reaches through a flooded limestone chamber, illuminating suspended silt. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "underwater-cenote-lightwell",
  name: "Underwater Cenote Lightwell",
  category: "landscapes",
  note: "A shaft of daylight reaches through a flooded limestone chamber, illuminating suspended silt.",
  tags: ["landscapes","ocean","cenote","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(188, 46, 8),
    hsl(197, 42, 17),
    hsl(204, 42, 28),
    hsl(208, 48, 42),
    hsl(213, 58, 57),
    hsl(219, 70, 73),
    hsl(6, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "ocean", form: "cenote", seed: 1473 });
}
