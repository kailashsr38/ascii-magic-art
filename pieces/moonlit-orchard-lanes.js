/* moonlit-orchard-lanes: Silver moonlight falls across orchard rows while fireflies drift above the grass. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "moonlit-orchard-lanes",
  name: "Moonlit Orchard Lanes",
  category: "landscapes",
  note: "Silver moonlight falls across orchard rows while fireflies drift above the grass.",
  tags: ["landscapes","garden","orchard","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(258, 46, 8),
    hsl(267, 42, 17),
    hsl(274, 42, 28),
    hsl(278, 48, 42),
    hsl(283, 58, 57),
    hsl(289, 70, 73),
    hsl(76, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "garden", form: "orchard", seed: 1362 });
}
