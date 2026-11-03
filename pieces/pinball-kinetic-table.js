/* pinball-kinetic-table: A pinball table cycles through bumpers, ramps and a bright return lane. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "pinball-kinetic-table",
  name: "Pinball Kinetic Table",
  category: "arcade",
  note: "A pinball table cycles through bumpers, ramps and a bright return lane.",
  tags: ["arcade","arcade","pinball","animated","ascii-art"],
  cols: 88,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(338, 46, 8),
    hsl(347, 42, 17),
    hsl(354, 42, 28),
    hsl(358, 48, 42),
    hsl(3, 58, 57),
    hsl(9, 70, 73),
    hsl(156, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "arcade", form: "pinball", seed: 3804 });
}
