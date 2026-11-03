/* spiral-milling-toolpath: A cutting path spirals inward across a workpiece, leaving a precise animated trail. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "spiral-milling-toolpath",
  name: "Spiral Milling Toolpath",
  category: "algorithms",
  note: "A cutting path spirals inward across a workpiece, leaving a precise animated trail.",
  tags: ["algorithms","fractal","toolpath","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(192, 46, 8),
    hsl(201, 42, 17),
    hsl(208, 42, 28),
    hsl(212, 48, 42),
    hsl(217, 58, 57),
    hsl(223, 70, 73),
    hsl(10, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "fractal", form: "toolpath", seed: 3656 });
}
