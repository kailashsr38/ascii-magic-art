/* tectonic-subduction-crosscut: A cross-section shows one oceanic plate descending beneath another, lifting a volcanic arc above. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "tectonic-subduction-crosscut",
  name: "Tectonic Subduction Crosscut",
  category: "science",
  note: "A cross-section shows one oceanic plate descending beneath another, lifting a volcanic arc above.",
  tags: ["science","diagram","tectonic","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(28, 46, 8),
    hsl(37, 42, 17),
    hsl(44, 42, 28),
    hsl(48, 48, 42),
    hsl(53, 58, 57),
    hsl(59, 70, 73),
    hsl(206, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "tectonic", seed: 4433 });
}
