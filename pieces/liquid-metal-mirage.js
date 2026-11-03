/* liquid-metal-mirage: A reflective metallic surface folds into impossible waves with highlights skating across each crest. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "liquid-metal-mirage",
  name: "Liquid Metal Mirage",
  category: "demoscene",
  note: "A reflective metallic surface folds into impossible waves with highlights skating across each crest.",
  tags: ["demoscene","field","liquid-metal","animated","ascii-art"],
  cols: 92,
  rows: 30,
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
  return createAtelier(meta, { kind: "field", form: "liquid-metal", seed: 3730 });
}
