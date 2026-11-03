/* fogbound-ferry-terminal: A quiet ferry waits at the pier as harbour lights dissolve into a soft wall of fog. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "fogbound-ferry-terminal",
  name: "Fogbound Ferry Terminal",
  category: "landscapes",
  note: "A quiet ferry waits at the pier as harbour lights dissolve into a soft wall of fog.",
  tags: ["landscapes","architecture","ferry","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(204, 46, 8),
    hsl(213, 42, 17),
    hsl(220, 42, 28),
    hsl(224, 48, 42),
    hsl(229, 58, 57),
    hsl(235, 70, 73),
    hsl(22, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "ferry", seed: 1325 });
}
