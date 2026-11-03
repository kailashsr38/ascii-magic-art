/* dublin-doorways-after-rain: Georgian doorways glow beneath wet fanlights as reflections stretch along the pavement. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "dublin-doorways-after-rain",
  name: "Dublin Doorways After Rain",
  category: "cities",
  note: "Georgian doorways glow beneath wet fanlights as reflections stretch along the pavement.",
  tags: ["cities","architecture","dublin","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(196, 46, 8),
    hsl(205, 42, 17),
    hsl(212, 42, 28),
    hsl(216, 48, 42),
    hsl(221, 58, 57),
    hsl(227, 70, 73),
    hsl(14, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "dublin", seed: 4063 });
}
