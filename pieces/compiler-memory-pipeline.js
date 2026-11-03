/* compiler-memory-pipeline: A source token travels through parsing, intermediate representation, optimisation and machine code. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "compiler-memory-pipeline",
  name: "Compiler Memory Pipeline",
  category: "explainers",
  note: "A source token travels through parsing, intermediate representation, optimisation and machine code.",
  tags: ["explainers","diagram","compiler","animated","ascii-art"],
  cols: 92,
  rows: 28,
  fps: 24,
  palette: palette([
    hsl(218, 46, 8),
    hsl(227, 42, 17),
    hsl(234, 42, 28),
    hsl(238, 48, 42),
    hsl(243, 58, 57),
    hsl(249, 70, 73),
    hsl(36, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "diagram", form: "compiler", seed: 2176 });
}
