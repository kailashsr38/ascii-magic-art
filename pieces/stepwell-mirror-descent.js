/* stepwell-mirror-descent: A deep stepwell descends in precise sandstone terraces toward a pool that mirrors the sky. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "stepwell-mirror-descent",
  name: "Stepwell Mirror Descent",
  category: "india",
  note: "A deep stepwell descends in precise sandstone terraces toward a pool that mirrors the sky.",
  tags: ["india","architecture","stepwell","animated","ascii-art"],
  cols: 90,
  rows: 32,
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
  return createAtelier(meta, { kind: "architecture", form: "stepwell", seed: 4692 });
}
