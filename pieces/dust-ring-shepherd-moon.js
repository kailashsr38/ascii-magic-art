/* dust-ring-shepherd-moon: A small moon sculpts narrow gaps through a broad ring system as grains drift in its wake. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "dust-ring-shepherd-moon",
  name: "Dust Ring Shepherd Moon",
  category: "cosmos",
  note: "A small moon sculpts narrow gaps through a broad ring system as grains drift in its wake.",
  tags: ["cosmos","orbit","rings","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(32, 46, 8),
    hsl(41, 42, 17),
    hsl(48, 42, 28),
    hsl(52, 48, 42),
    hsl(57, 58, 57),
    hsl(63, 70, 73),
    hsl(210, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "orbit", form: "rings", seed: 2731 });
}
