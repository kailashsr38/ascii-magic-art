/* saffron-steam-risotto: A warm bowl of saffron risotto releases delicate curls of steam above a dark wooden table. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "saffron-steam-risotto",
  name: "Saffron Steam Risotto",
  category: "food",
  note: "A warm bowl of saffron risotto releases delicate curls of steam above a dark wooden table.",
  tags: ["food","food","risotto","animated","ascii-art"],
  cols: 88,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(38, 46, 8),
    hsl(47, 42, 17),
    hsl(54, 42, 28),
    hsl(58, 48, 42),
    hsl(63, 58, 57),
    hsl(69, 70, 73),
    hsl(216, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "food", form: "risotto", seed: 4618 });
}
