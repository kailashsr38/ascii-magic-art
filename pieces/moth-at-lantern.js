/* moth-at-lantern: A pale moth circles a paper lantern, its wingbeats briefly catching the light. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "moth-at-lantern",
  name: "Moth at the Lantern",
  category: "animals",
  note: "A pale moth circles a paper lantern, its wingbeats briefly catching the light.",
  tags: ["animals","animal","moth","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(42, 46, 8),
    hsl(51, 42, 17),
    hsl(58, 42, 28),
    hsl(62, 48, 42),
    hsl(67, 58, 57),
    hsl(73, 70, 73),
    hsl(220, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "animal", form: "moth", seed: 3360 });
}
