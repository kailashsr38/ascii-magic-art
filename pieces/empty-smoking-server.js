/* empty-smoking-server: a little server box with a dizzy face puffs smoke rings from its vent, a friendly server error. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#b1bac4", "#8b949e", "#6e7681", "#484f58", "#30363d", "#1f2428", "#ffb4a8"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-e smoke light to dark, f screen, g pale red

export const meta = {
  slug: "empty-smoking-server",
  name: "Smoking Server Box",
  category: "empty-states",
  note: "A small server box with a dizzy face puffs smoke from its vent, a friendly something went wrong state.",
  tags: ["empty-state", "error", "500", "server", "app"],
  cols: 56, rows: 21, fps: 20,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const LIFE = 3.2, EVERY = 0.55, SH = "░▒▓█";

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const BX = 17, BY = 6, BW = 22, BH = 7, VX = BX + 15;
  const dens = new Float32Array(W * H);
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    // smoke: puffs leave the vent, rise, drift right and swell
    dens.fill(0);
    const n0 = Math.floor((t - LIFE) / EVERY);
    for (let n = n0; n <= Math.floor(t / EVERY); n++) {
      const age = t - n * EVERY;
      if (age < 0 || age > LIFE) continue;
      const u = age / LIFE;
      const cx = VX + u * 9 + Math.sin(n * 1.7 + age * 2) * 1.2, cy = BY - 0.6 - u * 5.2;
      const r = 1.0 + u * 2.6, a = (1 - u) * 1.1;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r * 2); x <= cx + r * 2; x++) {
        if (y < 1 || y >= BY || x < 1 || x >= W - 1) continue;
        const d = Math.hypot((x - cx) / 2, y - cy) / r;
        if (d < 1) dens[x + y * W] += a * (1 - d * d);
      }
    }
    for (let y = 1; y < BY; y++) for (let x = 1; x < W - 1; x++) {
      const v = dens[x + y * W];
      if (v < 0.12) continue;
      const k = clamp(v);
      g.set(x, y, SH[Math.min(3, Math.floor(k * 4))], "edcba"[Math.min(4, Math.floor(k * 5))]);
    }
    // the box
    g.fill(BX, BY, BW, BH, " ");
    g.box(BX, BY, BW, BH, "round", "1");
    g.fill(BX + 2, BY + 1, 9, 3, "█", "f");
    const blink = Math.floor(t * 1.3) % 5 === 0;
    g.text(BX + 3, BY + 2, blink ? "- _ -" : "x _ x", "7");
    for (let k = 0; k < 3; k++) g.text(VX - 2, BY + 1 + k, "≡≡≡≡", "2");
    const ledOn = Math.floor(t * 4) % 2 === 0;
    g.text(BX + 2, BY + 5, "●", ledOn ? "7" : "3"); g.text(BX + 4, BY + 5, "●", "3"); g.text(BX + 6, BY + 5, "●", "3");
    g.text(BX + 9, BY + 5, "SRV-02", "2");
    // feet
    g.text(BX + 2, BY + BH, "▀▀", "2"); g.text(BX + BW - 4, BY + BH, "▀▀", "2");
    mid(15, "Something went wrong on our side", "0");
    mid(16, "We've been alerted and are looking into it.", "1");
    const label = "Try again", bw = label.length + 4, bx = Math.floor((W - bw) / 2) - 6;
    g.box(bx, 17, bw, 3, "round", "5"); g.text(bx + 2, 18, label, "5");
    g.text(bx + bw + 2, 18, "Error 503 · ref 7f3c", "2");
    return g.frame();
  };
}
