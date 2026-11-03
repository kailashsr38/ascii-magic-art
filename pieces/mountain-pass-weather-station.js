/* mountain-pass-weather-station: A lone weather station watches cloud shadows race over a high mountain pass. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "mountain-pass-weather-station",
  name: "Mountain Pass Weather Station",
  category: "landscapes",
  note: "A lone weather station watches cloud shadows race over a high mountain pass.",
  tags: ["landscapes","architecture","weather-station","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(206, 46, 8),
    hsl(215, 42, 17),
    hsl(222, 42, 28),
    hsl(226, 48, 42),
    hsl(231, 58, 57),
    hsl(237, 70, 73),
    hsl(24, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "weather-station", seed: 1510 });
}
