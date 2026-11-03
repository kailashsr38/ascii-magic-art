/* inventory-reconcile-workbench: A stockroom workbench compares expected counts, scanned items and the final reconciliation. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "inventory-reconcile-workbench",
  name: "Inventory Reconcile Workbench",
  category: "screens",
  note: "A stockroom workbench compares expected counts, scanned items and the final reconciliation.",
  tags: ["screens","screen","inventory","animated","ascii-art"],
  cols: 88,
  rows: 27,
  fps: 24,
  palette: palette([
    hsl(152, 46, 8),
    hsl(161, 42, 17),
    hsl(168, 42, 28),
    hsl(172, 48, 42),
    hsl(177, 58, 57),
    hsl(183, 70, 73),
    hsl(330, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "screen", form: "inventory", seed: 1917 });
}
