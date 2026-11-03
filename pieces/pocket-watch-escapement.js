/* pocket-watch-escapement: A watch's balance wheel and pallet fork trade precise impulses beneath a glass face. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "pocket-watch-escapement",
  name: "Pocket Watch Escapement",
  category: "things",
  note: "A watch's balance wheel and pallet fork trade precise impulses beneath a glass face.",
  tags: ["things","object","watch","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(36, 46, 8),
    hsl(45, 42, 17),
    hsl(52, 42, 28),
    hsl(56, 48, 42),
    hsl(61, 58, 57),
    hsl(67, 70, 73),
    hsl(214, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "object", form: "watch", seed: 3471 });
}
