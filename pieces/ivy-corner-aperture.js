/* ivy-corner-aperture: An architectural corner frame grows with delicate ivy, tiny buds and a travelling glint. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "ivy-corner-aperture",
  name: "Ivy Corner Aperture",
  category: "frames",
  note: "An architectural corner frame grows with delicate ivy, tiny buds and a travelling glint.",
  tags: ["frames","frame","ivy","animated","ascii-art"],
  cols: 92,
  rows: 18,
  fps: 24,
  palette: palette([
    hsl(112, 46, 8),
    hsl(121, 42, 17),
    hsl(128, 42, 28),
    hsl(132, 48, 42),
    hsl(137, 58, 57),
    hsl(143, 70, 73),
    hsl(290, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "frame", form: "ivy", seed: 3915 });
}
