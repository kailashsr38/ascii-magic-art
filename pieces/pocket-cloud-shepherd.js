/* pocket-cloud-shepherd: A tiny caretaker nudges soft clouds into a neat line above a sleepy hill. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "pocket-cloud-shepherd",
  name: "Pocket Cloud Shepherd",
  category: "mascots",
  note: "A tiny caretaker nudges soft clouds into a neat line above a sleepy hill.",
  tags: ["mascots","animal","cloud-shepherd","animated","ascii-art"],
  cols: 88,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(206, 46, 8),
    hsl(215, 42, 17),
    hsl(222, 42, 28),
    hsl(226, 48, 42),
    hsl(231, 58, 57),
    hsl(237, 70, 73),
    hsl(24, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "animal", form: "cloud-shepherd", seed: 4211 });
}
