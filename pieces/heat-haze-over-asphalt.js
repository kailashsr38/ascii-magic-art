/* heat-haze-over-asphalt: The horizon buckles above warm asphalt as mirage bands shimmer in the afternoon air. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "heat-haze-over-asphalt",
  name: "Heat Haze Over Asphalt",
  category: "weather",
  note: "The horizon buckles above warm asphalt as mirage bands shimmer in the afternoon air.",
  tags: ["weather","weather","heat-haze","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(22, 46, 8),
    hsl(31, 42, 17),
    hsl(38, 42, 28),
    hsl(42, 48, 42),
    hsl(47, 58, 57),
    hsl(53, 70, 73),
    hsl(200, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "weather", form: "heat-haze", seed: 3101 });
}
