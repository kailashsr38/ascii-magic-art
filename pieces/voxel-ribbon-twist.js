/* voxel-ribbon-twist: A dense ribbon of voxels twists through perspective, alternating bright faces and shadowed folds. */
import { hsl, palette } from "../lib/kit.js";
import { createAtelier } from "../lib/atelier.js";

export const meta = {
  slug: "voxel-ribbon-twist",
  name: "Voxel Ribbon Twist",
  category: "demoscene",
  note: "A dense ribbon of voxels twists through perspective, alternating bright faces and shadowed folds.",
  tags: ["demoscene","field","voxel","animated","ascii-art"],
  cols: 92,
  rows: 30,
  fps: 24,
  palette: palette([
    hsl(274, 46, 8),
    hsl(283, 42, 17),
    hsl(290, 42, 28),
    hsl(294, 48, 42),
    hsl(299, 58, 57),
    hsl(305, 70, 73),
    hsl(92, 48, 68)
  ])
};

export default function create() {
  return createAtelier(meta, { kind: "field", form: "voxel", seed: 3693 });
}
