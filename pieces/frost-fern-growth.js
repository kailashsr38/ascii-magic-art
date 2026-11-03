/* frost-fern-growth: A frost fern branches outward across a window, crystalline tips forming and fading in the cold. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "frost-fern-growth",
  name: "Frost Fern Growth",
  category: "weather",
  note: "A frost fern branches outward across a window, crystalline tips forming and fading in the cold.",
  tags: ["weather","weather","frost","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(198, 46, 8),
    hsl(207, 42, 17),
    hsl(214, 42, 28),
    hsl(218, 48, 42),
    hsl(223, 58, 57),
    hsl(229, 70, 73),
    hsl(16, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "weather", form: "frost", seed: 3138 });
}
