/* resonant-bell-overtones: A struck bell blooms into concentric overtones, each partial fading at its own pace. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "resonant-bell-overtones",
  name: "Resonant Bell Overtones",
  category: "music",
  note: "A struck bell blooms into concentric overtones, each partial fading at its own pace.",
  tags: ["music","music","bell","animated","ascii-art"],
  cols: 90,
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
  return createAtelier(meta, { kind: "music", form: "bell", seed: 4581 });
}
