/* yuzu-peel-soda-fizz: A chilled glass catches citrus light as fine bubbles climb through a pale sparkling drink. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "yuzu-peel-soda-fizz",
  name: "Yuzu Peel Soda Fizz",
  category: "food",
  note: "A chilled glass catches citrus light as fine bubbles climb through a pale sparkling drink.",
  tags: ["food","food","soda","animated","ascii-art"],
  cols: 88,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(72, 46, 8),
    hsl(81, 42, 17),
    hsl(88, 42, 28),
    hsl(92, 48, 42),
    hsl(97, 58, 57),
    hsl(103, 70, 73),
    hsl(250, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "food", form: "soda", seed: 4655 });
}
