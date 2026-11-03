/* prague-clockmakers-window: A clockmaker's window reveals brass wheels turning behind a frost-edged pane. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "prague-clockmakers-window",
  name: "Prague Clockmaker's Window",
  category: "cities",
  note: "A clockmaker's window reveals brass wheels turning behind a frost-edged pane.",
  tags: ["cities","architecture","prague","animated","ascii-art"],
  cols: 90,
  rows: 32,
  fps: 24,
  palette: palette([
    hsl(38, 46, 8),
    hsl(47, 42, 17),
    hsl(54, 42, 28),
    hsl(58, 48, 42),
    hsl(63, 58, 57),
    hsl(69, 70, 73),
    hsl(216, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "architecture", form: "prague", seed: 4174 });
}
