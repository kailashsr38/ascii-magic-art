/* orbiting-ink-moth: A small ink-dark moth circles a floating drop of light, leaving a dotted orbit behind. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "orbiting-ink-moth",
  name: "Orbiting Ink Moth",
  category: "mascots",
  note: "A small ink-dark moth circles a floating drop of light, leaving a dotted orbit behind.",
  tags: ["mascots","animal","ink-moth","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(278, 46, 8),
    hsl(287, 42, 17),
    hsl(294, 42, 28),
    hsl(298, 48, 42),
    hsl(303, 58, 57),
    hsl(309, 70, 73),
    hsl(96, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "animal", form: "ink-moth", seed: 4285 });
}
