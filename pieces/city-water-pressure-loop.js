/* city-water-pressure-loop: A water network balances reservoir height, pump pressure and demand across a city block. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "city-water-pressure-loop",
  name: "City Water Pressure Loop",
  category: "explainers",
  note: "A water network balances reservoir height, pump pressure and demand across a city block.",
  tags: ["explainers","diagram","water-loop","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(190, 46, 8),
    hsl(199, 42, 17),
    hsl(206, 42, 28),
    hsl(210, 48, 42),
    hsl(215, 58, 57),
    hsl(221, 70, 73),
    hsl(8, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "water-loop", seed: 2324 });
}
