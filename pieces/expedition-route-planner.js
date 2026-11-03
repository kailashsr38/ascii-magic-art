/* expedition-route-planner: A field-planning workspace layers contour lines, checkpoints, weather and a route profile. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "expedition-route-planner",
  name: "Expedition Route Planner",
  category: "screens",
  note: "A field-planning workspace layers contour lines, checkpoints, weather and a route profile.",
  tags: ["screens","screen","route-planner","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(150, 46, 8),
    hsl(159, 42, 17),
    hsl(166, 42, 28),
    hsl(170, 48, 42),
    hsl(175, 58, 57),
    hsl(181, 70, 73),
    hsl(328, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "route-planner", seed: 1695 });
}
