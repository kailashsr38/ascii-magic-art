/* lisbon-funicular-blue-hour: A yellow funicular climbs a steep Lisbon street as tiled facades catch the last blue light. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "lisbon-funicular-blue-hour",
  name: "Lisbon Funicular at Blue Hour",
  category: "cities",
  note: "A yellow funicular climbs a steep Lisbon street as tiled facades catch the last blue light.",
  tags: ["cities","architecture","lisbon","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(48, 46, 8),
    hsl(57, 42, 17),
    hsl(64, 42, 28),
    hsl(68, 48, 42),
    hsl(73, 58, 57),
    hsl(79, 70, 73),
    hsl(226, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "lisbon", seed: 4100 });
}
