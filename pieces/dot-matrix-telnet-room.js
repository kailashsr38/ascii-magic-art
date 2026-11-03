/* dot-matrix-telnet-room: A monochrome terminal room prints a live session log across an old phosphor display. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "dot-matrix-telnet-room",
  name: "Dot Matrix Telnet Room",
  category: "retro",
  note: "A monochrome terminal room prints a live session log across an old phosphor display.",
  tags: ["retro","retro","telnet","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(126, 46, 8),
    hsl(135, 42, 17),
    hsl(142, 42, 28),
    hsl(146, 48, 42),
    hsl(151, 58, 57),
    hsl(157, 70, 73),
    hsl(304, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "retro", form: "telnet", seed: 4359 });
}
