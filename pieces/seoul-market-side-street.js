/* seoul-market-side-street: A narrow market lane glows with paper signs, warm windows and a passing bicycle. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "seoul-market-side-street",
  name: "Seoul Market Side Street",
  category: "cities",
  note: "A narrow market lane glows with paper signs, warm windows and a passing bicycle.",
  tags: ["cities","architecture","seoul","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(338, 46, 8),
    hsl(347, 42, 17),
    hsl(354, 42, 28),
    hsl(358, 48, 42),
    hsl(3, 58, 57),
    hsl(9, 70, 73),
    hsl(156, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "seoul", seed: 4137 });
}
