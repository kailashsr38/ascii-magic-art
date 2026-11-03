/* shortwave-frequency-dial: A shortwave receiver sweeps through bands as the tuning eye and signal needle settle on a station. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "shortwave-frequency-dial",
  name: "Shortwave Frequency Dial",
  category: "retro",
  note: "A shortwave receiver sweeps through bands as the tuning eye and signal needle settle on a station.",
  tags: ["retro","retro","shortwave","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(146, 46, 8),
    hsl(155, 42, 17),
    hsl(162, 42, 28),
    hsl(166, 48, 42),
    hsl(171, 58, 57),
    hsl(177, 70, 73),
    hsl(324, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "retro", form: "shortwave", seed: 4322 });
}
