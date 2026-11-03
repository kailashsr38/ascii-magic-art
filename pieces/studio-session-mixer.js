/* studio-session-mixer: A mixing desk interface balances channels, sends and a live master waveform. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "studio-session-mixer",
  name: "Studio Session Mixer",
  category: "screens",
  note: "A mixing desk interface balances channels, sends and a live master waveform.",
  tags: ["screens","screen","mixer","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(194, 46, 8),
    hsl(203, 42, 17),
    hsl(210, 42, 28),
    hsl(214, 48, 42),
    hsl(219, 58, 57),
    hsl(225, 70, 73),
    hsl(12, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "mixer", seed: 1658 });
}
