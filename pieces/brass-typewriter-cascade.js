/* brass-typewriter-cascade: A line of type falls into place as if struck on a finely tuned brass machine. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "brass-typewriter-cascade",
  name: "Brass Typewriter Cascade",
  category: "lettering",
  note: "A line of type falls into place as if struck on a finely tuned brass machine.",
  tags: ["lettering","letter","typewriter","animated","ascii-art"],
  cols: 88,
  rows: 26,
  fps: 24,
  palette: palette([
    hsl(36, 46, 8),
    hsl(45, 42, 17),
    hsl(52, 42, 28),
    hsl(56, 48, 42),
    hsl(61, 58, 57),
    hsl(67, 70, 73),
    hsl(214, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "letter", form: "typewriter", seed: 2435 });
}
