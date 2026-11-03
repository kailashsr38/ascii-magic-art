/* rain-on-glasshouse-roof: Droplets travel down a vaulted glass roof above a warm, densely planted greenhouse. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "rain-on-glasshouse-roof",
  name: "Rain on a Glasshouse Roof",
  category: "landscapes",
  note: "Droplets travel down a vaulted glass roof above a warm, densely planted greenhouse.",
  tags: ["landscapes","garden","glasshouse","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(158, 46, 8),
    hsl(167, 42, 17),
    hsl(174, 42, 28),
    hsl(178, 48, 42),
    hsl(183, 58, 57),
    hsl(189, 70, 73),
    hsl(336, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "garden", form: "glasshouse", seed: 1547 });
}
