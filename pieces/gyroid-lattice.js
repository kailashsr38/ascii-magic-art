/* gyroid-lattice: A porous gyroid surface reveals an intricate lattice as the viewing angle slowly shifts. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "gyroid-lattice",
  name: "Gyroid Lattice",
  category: "solids",
  note: "A porous gyroid surface reveals an intricate lattice as the viewing angle slowly shifts.",
  tags: ["solids","solid","gyroid","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 30,
  palette: palette([
    hsl(188, 46, 8),
    hsl(197, 42, 17),
    hsl(204, 42, 28),
    hsl(208, 48, 42),
    hsl(213, 58, 57),
    hsl(219, 70, 73),
    hsl(6, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "solid", form: "gyroid", seed: 2583 });
}
