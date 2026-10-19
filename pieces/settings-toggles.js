/* settings-toggles: a settings panel with switches flipping and sliders easing to new values. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "settings-toggles",
  name: "Settings Toggles",
  category: "screens",
  note: "A settings panel where a focus marker moves down the list, flipping switches and dragging sliders.",
  tags: ["settings", "toggle", "slider", "app", "preferences"],
  cols: 66, rows: 17, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#2ea043"]),
};

// [kind, label, detail, keyframes [[time, value]...]]
const ITEMS = [
  ["h", "Appearance"],
  ["t", "Dark mode", "Use a dark theme everywhere", [[0, 1], [9.5, 0], [10.5, 1]]],
  ["t", "Reduce motion", "Tone down animations", [[0, 0], [1.2, 1], [11.2, 0]]],
  ["s", "Font size", "px", [[0, 14], [2.2, 18], [11.6, 14]], 10, 24],
  ["h", "Notifications"],
  ["t", "Email digest", "A summary every morning", [[0, 1], [3.4, 0], [12, 1]]],
  ["t", "Push alerts", "Mentions and direct messages", [[0, 0], [4.3, 1], [12.4, 0]]],
  ["s", "Volume", "%", [[0, 40], [5.3, 85], [12.8, 40]], 0, 100],
  ["h", "Privacy"],
  ["t", "Share usage data", "Help improve the product", [[0, 1], [6.6, 0], [13.2, 1]]],
  ["s", "Auto-lock", "min", [[0, 5], [7.6, 15], [13.6, 5]], 1, 30],
  ["t", "Two-factor login", "Ask for a code on new devices", [[0, 0], [8.6, 1], [14, 0]]],
];
const PERIOD = 15;

function val(kf, t, dur) {
  let v = kf[0][1];
  for (const [kt, kv] of kf) {
    if (t >= kt) {
      const p = Math.min(1, (t - kt) / dur), e = p * p * (3 - 2 * p);
      v = v + (kv - v) * e;
    }
  }
  return v;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, meta.rows, "round", "7");
    g.text(2, 0, " Settings ", "0");
    g.text(W - 18, 0, " ✓ Saved ", "2");
    let focus = -1, best = -1;
    ITEMS.forEach((it, i) => { if (it[3]) for (const [kt] of it[3]) if (kt > 0 && kt <= lt && kt > best) { best = kt; focus = i; } });
    let y = 1;
    ITEMS.forEach((it, i) => {
      if (it[0] === "h") {
        if (i) y++;
        g.text(2, y, it[1].toUpperCase(), "6");
        g.hline(3 + it[1].length, W - 3, y, "─", "8");
        y++;
        return;
      }
      const f = i === focus && lt - best < 1.4;
      if (f) g.set(1, y, "▌", "3");
      g.text(3, y, it[1], f ? "3" : "0");
      if (it[0] === "t") {
        g.text(22, y, it[2], "1");
        const p = val(it[3], lt, 0.25), on = p > 0.5;
        const sx = W - 13, kx = Math.round(p * 4);
        g.set(sx, y, "(", on ? "9" : "7");
        for (let k = 0; k < 5; k++) g.set(sx + 1 + k, y, k === kx ? "●" : k < kx ? "━" : "─", k === kx ? "0" : on ? "2" : "7");
        g.set(sx + 6, y, ")", on ? "9" : "7");
        g.text(sx + 8, y, on ? "On " : "Off", on ? "2" : "1");
      } else {
        const v = val(it[3], lt, 0.7), [, , unit, , lo, hi] = it;
        const sx = 22, sw = 30, kx = Math.round(((v - lo) / (hi - lo)) * (sw - 1));
        for (let k = 0; k < sw; k++) g.set(sx + k, y, k === kx ? "●" : k < kx ? "━" : "─", k === kx ? "0" : k < kx ? "3" : "7");
        g.text(sx + sw + 2, y, (Math.round(v) + " " + unit).padStart(7), f ? "3" : "0");
      }
      y++;
    });
    return g.frame();
  };
}
