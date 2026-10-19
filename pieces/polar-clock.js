/* polar-clock: a clock drawn as three concentric rings that fill for hours, minutes and seconds. */
import { Grid, palette, TAU } from "../lib/kit.js";

export const meta = {
  slug: "polar-clock",
  name: "Polar Ring Clock",
  category: "live-data",
  note: "A polar clock of three concentric rings, the outer one sweeping round with the seconds, the middle with the minutes and the inner with the hours, the time printed in the centre.",
  tags: ["clock", "time", "rings", "dashboard", "widget", "data"],
  cols: 64, rows: 30, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#ff7b72", "#7ee787", "#79c0ff", "#30363d", "#3a1a1a", "#163a20", "#142a44", "#484f58"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 25.5, cy = 14.5;
  const RINGS = [[24.5, 21, "2", "6"], [19, 15.5, "3", "7"], [13.5, 10, "4", "8"]];
  return (t) => {
    g.clear();
    const T0 = 10 * 3600 + 8 * 60 + 42;
    const s = T0 + t;
    const sec = (s % 60) / 60, min = ((s / 60) % 60) / 60, hr = ((s / 3600) % 12) / 12;
    const frac = [sec, min, hr];
    for (let y = 0; y < rows; y++) for (let x = 0; x < 50; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const r = Math.hypot(dx, dy);
      let a = Math.atan2(dx, -dy) / TAU; if (a < 0) a += 1;
      RINGS.forEach(([ro, ri, on, off], k) => {
        if (r > ro || r < ri) return;
        const lit = a <= frac[k];
        const head = lit && frac[k] - a < 0.012;
        g.set(x, y, head ? "█" : lit ? "█" : "░", head ? "0" : lit ? on : off);
      });
      // twelve tick marks just outside
      if (r > 25 && r < 26.6) {
        const q = a * 12;
        if (Math.abs(q - Math.round(q)) < 0.06) g.set(x, y, "■", "9");
      }
    }
    const pad = (n) => String(Math.floor(n)).padStart(2, "0");
    const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = Math.floor(s) % 60;
    const str = pad(hh) + ":" + pad(mm) + ":" + pad(ss);
    g.text(cx - 4, Math.floor(cy) - 1, str, "0");
    g.text(cx - 5, Math.floor(cy) + 1, "Thu 16 Oct", "1");
    // legend on the right
    const L = 52;
    [["sec", sec, "2"], ["min", min, "3"], ["hour", hr, "4"]].forEach(([n, f, co], i) => {
      g.text(L, 9 + i * 4, "■ " + n, co);
      g.text(L, 10 + i * 4, (f * 100).toFixed(0).padStart(3) + "%", "1");
    });
    return g.frame();
  };
}
