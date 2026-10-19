/* progress-loader: a stack of terminal progress bars, each filling at its own pace. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "progress-loader",
  name: "Progress Loader",
  category: "screens",
  note: "Four terminal progress bars filling at their own pace, with percent and a spinner.",
  tags: ["loader", "terminal", "cli", "install"],
  cols: 56, rows: 9, fps: 15,
  palette: palette(["#7ee787", "#79c0ff", "#8b949e", "#e6edf3"]),
};

const TASKS = [["fetch", 3.1], ["resolve", 4.3], ["build", 5.7], ["deploy", 7.2]];
const SPIN = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  return (t) => {
    g.clear();
    const loop = t % 9;
    TASKS.forEach(([name, dur], i) => {
      const y = 1 + i * 2;
      const p = Math.min(1, loop / dur);
      const w = 30, n = Math.round(p * w);
      g.text(2, y, (p < 1 ? SPIN[Math.floor(t * 12 + i) % SPIN.length] : "✓"), p < 1 ? "1" : "0");
      g.text(4, y, name.padEnd(8), "3");
      g.text(13, y, "█".repeat(n), p < 1 ? "1" : "0");
      g.text(13 + n, y, "░".repeat(w - n), "2");
      g.text(45, y, String(Math.round(p * 100)).padStart(3) + "%", "3");
    });
    return g.frame();
  };
}
