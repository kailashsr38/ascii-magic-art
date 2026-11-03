/* midnight-solstice-lantern-release: Lanterns rise at the longest night, their reflections trembling across a dark lake. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "midnight-solstice-lantern-release",
  name: "Midnight Solstice Lantern Release",
  category: "occasions",
  note: "Lanterns rise at the longest night, their reflections trembling across a dark lake.",
  tags: ["occasions","festival","solstice","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(258, 46, 8),
    hsl(267, 42, 17),
    hsl(274, 42, 28),
    hsl(278, 48, 42),
    hsl(283, 58, 57),
    hsl(289, 70, 73),
    hsl(76, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "festival", form: "solstice", seed: 4729 });
}
