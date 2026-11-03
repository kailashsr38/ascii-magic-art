/* parcel-sort-control: A sorting-floor console follows parcels across belts, diverters and dispatch bays. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "parcel-sort-control",
  name: "Parcel Sort Control",
  category: "screens",
  note: "A sorting-floor console follows parcels across belts, diverters and dispatch bays.",
  tags: ["screens","screen","parcel","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(36, 46, 8),
    hsl(45, 42, 17),
    hsl(52, 42, 28),
    hsl(56, 48, 42),
    hsl(61, 58, 57),
    hsl(67, 70, 73),
    hsl(214, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "parcel", seed: 1806 });
}
