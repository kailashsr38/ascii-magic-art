/* sleepy-radio-sprite: A little radio character nods to the rhythm of a faint signal, its dial glowing like a night-light. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "sleepy-radio-sprite",
  name: "Sleepy Radio Sprite",
  category: "mascots",
  note: "A little radio character nods to the rhythm of a faint signal, its dial glowing like a night-light.",
  tags: ["mascots","animal","radio-sprite","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(34, 46, 8),
    hsl(43, 42, 17),
    hsl(50, 42, 28),
    hsl(54, 48, 42),
    hsl(59, 58, 57),
    hsl(65, 70, 73),
    hsl(212, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "animal", form: "radio-sprite", seed: 4248 });
}
