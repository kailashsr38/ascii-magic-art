/* image-layer-pull: a container image pull with layers downloading, extracting and completing in parallel. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "image-layer-pull",
  name: "Container Layer Pull",
  category: "screens",
  note: "A container image pull where each layer downloads with its own progress bar, extracts and completes, ending with a digest.",
  tags: ["container", "terminal", "devops", "download", "loader", "cli"],
  cols: 90, rows: 20, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const LAYERS = [
  ["a3ed95caeb02", 31.4, 0.2], ["5f70bf18a086", 2.1, 0.3], ["c1d8a4b7e9f3", 48.2, 0.4], ["9e0f3a17bd52", 118.6, 0.5],
  ["2b6c4d8f1a90", 0.9, 0.6], ["d47e2a6b3c18", 12.7, 0.7], ["f02a9c3e7b61", 6.3, 1.2], ["7a1b5e9d0c24", 0.3, 1.6],
];
const PERIOD = 15;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const r = rng(3);
  const speed = LAYERS.map(() => 9 + r() * 14);
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " ops@runner-3 ", "1");
    g.text(2, 1, "$ ", "2"); g.text(4, 1, "ctr pull registry.internal/team/ledger-api:2.4.1".slice(0, Math.floor(lt / 0.02)), "0");
    if (lt < 1.0) return g.frame();
    g.text(2, 2, "2.4.1: Pulling from team/ledger-api", "0");
    let allDone = true, maxEnd = 0;
    LAYERS.forEach(([id, mb, start], i) => {
      const y = 3 + i;
      const dlT = mb / speed[i] + 0.4, exT = 0.3 + mb / 60;
      const t0 = 1.2 + start;
      const k = lt - t0;
      const end = t0 + dlT + exT;
      maxEnd = Math.max(maxEnd, end);
      g.text(2, y, id + ": ", "4");
      let state, c, p = 0;
      if (k < 0) { state = "Waiting"; c = "7"; allDone = false; }
      else if (k < dlT) { state = "Downloading"; c = "3"; p = k / dlT; allDone = false; }
      else if (k < dlT + exT) { state = "Extracting"; c = "9"; p = (k - dlT) / exT; allDone = false; }
      else { state = "Pull complete"; c = "2"; }
      if (k >= 0 && k < 0.25) { state = "Pulling fs layer"; c = "1"; }
      g.text(16, y, state.padEnd(17), c);
      if (state === "Downloading" || state === "Extracting") {
        const bw = 32, n = Math.floor(p * bw);
        g.text(34, y, "[" + "=".repeat(Math.max(0, n - 1)) + ">" + " ".repeat(bw - n) + "]", c);
        const fmt = (v) => (v >= 1 ? v.toFixed(1) + "MB" : (v * 1000).toFixed(0) + "kB");
        g.text(69, y, `${fmt(p * mb)}/${fmt(mb)}`.padStart(16), "1");
      }
    });
    const y = 4 + LAYERS.length;
    if (allDone) {
      g.text(2, y, "Digest: ", "0"); g.text(10, y, "sha256:4f9a2c71d0b8e35a6c1f7e90b2d4a8c3e5f60718293a4b5c6d7e8f9012a3b4c5", "1");
      g.text(2, y + 1, "Status: ", "0"); g.text(10, y + 1, "Downloaded newer image for registry.internal/team/ledger-api:2.4.1", "2");
      if (lt > maxEnd + 0.8) {
        g.text(2, y + 3, "$ ", "2"); g.text(4, y + 3, "ctr images ls | head -3", "0");
        g.text(2, y + 4, "REPOSITORY".padEnd(36) + "TAG".padEnd(9) + "IMAGE ID".padEnd(15) + "SIZE", "1");
        g.text(2, y + 5, "registry.internal/team/ledger-api".padEnd(36) + "2.4.1".padEnd(9) + "4f9a2c71d0b8".padEnd(15) + "221MB", "0");
        g.text(2, y + 6, "registry.internal/team/ledger-api".padEnd(36) + "2.4.0".padEnd(9) + "e1b7d0a93c42".padEnd(15) + "219MB", "7");
      }
    } else {
      const tot = LAYERS.reduce((a, l) => a + l[1], 0);
      g.text(2, y + 1, `pulling ${LAYERS.length} layers · ${tot.toFixed(1)} MB total · 3 concurrent`, "7");
    }
    return g.frame();
  };
}
