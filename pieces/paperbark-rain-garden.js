/* paperbark-rain-garden: Rain threads through pale paperbark trunks, fern fans and a still garden pool. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "paperbark-rain-garden",
  name: "Paperbark Rain Garden",
  category: "landscapes",
  note: "Rain threads through pale paperbark trunks, fern fans and a still garden pool.",
  tags: ["landscapes","garden","paperbark","animated","ascii-art"],
  cols: 92,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(112, 46, 8),
    hsl(121, 42, 17),
    hsl(128, 42, 28),
    hsl(132, 48, 42),
    hsl(137, 58, 57),
    hsl(143, 70, 73),
    hsl(290, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "garden", form: "paperbark", seed: 1177 });
}
