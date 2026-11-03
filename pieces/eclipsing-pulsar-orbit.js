/* eclipsing-pulsar-orbit: Two compact stars circle one another, trading bright pulses as their beams cross the viewing plane. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "eclipsing-pulsar-orbit",
  name: "Eclipsing Pulsar Orbit",
  category: "cosmos",
  note: "Two compact stars circle one another, trading bright pulses as their beams cross the viewing plane.",
  tags: ["cosmos","orbit","pulsar","animated","ascii-art"],
  cols: 90,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(250, 46, 8),
    hsl(259, 42, 17),
    hsl(266, 42, 28),
    hsl(270, 48, 42),
    hsl(275, 58, 57),
    hsl(281, 70, 73),
    hsl(68, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "orbit", form: "pulsar", seed: 2694 });
}
