/* dew-on-spider-silk: Dew beads gather along a fine web while a breeze moves the silk by a fraction of a thread. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "dew-on-spider-silk",
  name: "Dew on Spider Silk",
  category: "weather",
  note: "Dew beads gather along a fine web while a breeze moves the silk by a fraction of a thread.",
  tags: ["weather","weather","dew","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(192, 46, 8),
    hsl(201, 42, 17),
    hsl(208, 42, 28),
    hsl(212, 48, 42),
    hsl(217, 58, 57),
    hsl(223, 70, 73),
    hsl(10, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "weather", form: "dew", seed: 3027 });
}
