/* incident-command-console: An operations console tracks service health, active incidents and the handover timeline. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "incident-command-console",
  name: "Incident Command Console",
  category: "screens",
  note: "An operations console tracks service health, active incidents and the handover timeline.",
  tags: ["screens","screen","incident","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(210, 46, 8),
    hsl(219, 42, 17),
    hsl(226, 42, 28),
    hsl(230, 48, 42),
    hsl(235, 58, 57),
    hsl(241, 70, 73),
    hsl(28, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "incident", seed: 1769 });
}
