/* lunar-delivery-run: A small rover carries a parcel across a crater field, dodging rocks on the way to a beacon. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "lunar-delivery-run",
  name: "Lunar Delivery Run",
  category: "arcade",
  note: "A small rover carries a parcel across a crater field, dodging rocks on the way to a beacon.",
  tags: ["arcade","arcade","lunar","animated","ascii-art"],
  cols: 88,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(214, 46, 8),
    hsl(223, 42, 17),
    hsl(230, 42, 28),
    hsl(234, 48, 42),
    hsl(239, 58, 57),
    hsl(245, 70, 73),
    hsl(32, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "arcade", form: "lunar", seed: 3841 });
}
