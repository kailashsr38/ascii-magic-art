/* salt-marsh-reflection: A narrow creek mirrors the pale evening sky between reeds and wide tidal flats. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "salt-marsh-reflection",
  name: "Salt Marsh Reflection",
  category: "landscapes",
  note: "A narrow creek mirrors the pale evening sky between reeds and wide tidal flats.",
  tags: ["landscapes","landscape","marsh","animated","ascii-art"],
  cols: 92,
  rows: 32,
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
  return createAtelier(meta, { kind: "landscape", form: "marsh", seed: 1251 });
}
