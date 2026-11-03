/* basalt-archipelago: Dark volcanic columns rise from a calm cold sea, their edges catching a thin line of sunrise. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "basalt-archipelago",
  name: "Basalt Archipelago",
  category: "landscapes",
  note: "Dark volcanic columns rise from a calm cold sea, their edges catching a thin line of sunrise.",
  tags: ["landscapes","landscape","basalt","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(210, 46, 8),
    hsl(219, 42, 17),
    hsl(226, 42, 28),
    hsl(230, 48, 42),
    hsl(235, 58, 57),
    hsl(241, 70, 73),
    hsl(28, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "landscape", form: "basalt", seed: 1288 });
}
