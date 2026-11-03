/* red-panda-canopy: A red panda balances along a mossy branch as leaves move around its curled tail. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "red-panda-canopy",
  name: "Red Panda Canopy",
  category: "animals",
  note: "A red panda balances along a mossy branch as leaves move around its curled tail.",
  tags: ["animals","animal","panda","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(22, 46, 8),
    hsl(31, 42, 17),
    hsl(38, 42, 28),
    hsl(42, 48, 42),
    hsl(47, 58, 57),
    hsl(53, 70, 73),
    hsl(200, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "animal", form: "panda", seed: 3249 });
}
