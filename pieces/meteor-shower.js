/* meteor-shower: meteors streaking down from one point of a deep night sky over a mountain lake. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#02030c", "#060a22", "#0c1438", "#1a1c4c", "#33255a", "#5a3266", "#8a4a6a"], 12));
add("milky", gradient(["#141a40", "#2a3060", "#4a4c80", "#7a74a8"], 4));
add("star", ["#7a84b4", "#c8d0f4", "#ffffff"]);
add("met", gradient(["#2a3a7a", "#4a6ad0", "#8ab4ff", "#d0e4ff", "#ffffff"], 8));
add("hill", gradient(["#020208", "#0a0a1e", "#141430"], 3));
add("lake", gradient(["#05060f", "#120f2e", "#2a1a44"], 3));
export const meta = {
  slug: "meteor-shower",
  name: "Meteor Shower Lake",
  category: "cosmos",
  note: "Meteors streak down from one point of a deep violet night sky, bright heads and fading trails, over dark hills and a still mountain lake that mirrors them.",
  tags: ["meteor", "night", "sky", "stars", "wallpaper", "hero"],
  cols: 104, rows: 36, fps: 30,
  palette: palette(all),
};
const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const HOR = 25, LAKE = 27;
  const r = rng(21);
  const stars = [];
  for (let i = 0; i < 150; i++) stars.push([Math.floor(r() * cols), Math.floor(r() * HOR), r() < 0.12 ? 2 : r() < 0.4 ? 1 : 0]);
  // sky base, milky way and hills are static: paint once
  const base = [];
  const hill = (x) => HOR + 1.5 - 9 * fbm(x * 0.045, 0.5, 4, 6) - 6 * Math.exp(-(((x - 24) / 9) ** 2));
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let ch = "░", co;
    if (y < LAKE) {
      const v = clamp(y / (HOR + 1));
      co = K("sky", Math.min(11, Math.floor(v * 12)));
      if (v > 0.55) ch = "▒";
      const band = Math.exp(-(((y - (x * 0.32 - 4)) / 5.5) ** 2)) * fbm(x * 0.08, y * 0.2, 4, 2);
      if (band > 0.36) { ch = band > 0.45 ? "▓" : "▒"; co = K("milky", Math.min(3, Math.floor((band - 0.34) * 14))); }
      if (y >= hill(x)) { ch = "█"; co = K("hill", y > hill(x) + 3 ? 0 : 1); }
    } else {
      const v = clamp((y - LAKE) / (rows - LAKE));
      ch = v > 0.5 ? "▒" : "░"; co = K("lake", Math.min(2, Math.floor((1 - v) * 3)));
    }
    base.push([ch, co]);
  }
  for (const [x, y, b] of stars) if (y < hill(x) - 1) base[x + y * cols] = [b === 2 ? "+" : b ? "•" : "·", K("star", b)];
  // meteor schedule: repeating slots, each meteor with its own start, angle and length
  const N = 26, PER = 8;
  const RAD = [86, -6];
  const mets = [];
  for (let i = 0; i < N; i++) mets.push({ t0: (i / N) * PER + r() * 0.4, dir: 0.35 + r() * 0.9, d0: 6 + r() * 26, len: 14 + r() * 26, dur: 0.5 + r() * 0.5, br: 0.6 + r() * 0.4 });
  return (t) => {
    for (let i = 0; i < base.length; i++) { g.ch[i] = base[i][0]; g.co[i] = base[i][1]; }
    for (const m of mets) {
      const age = ((t - m.t0) % PER + PER) % PER;
      if (age > m.dur + 0.5) continue;
      const p = Math.min(1, age / m.dur);
      const fade = age > m.dur ? 1 - (age - m.dur) / 0.5 : 1;
      const dx = -Math.cos(m.dir) * 2, dy = Math.sin(m.dir);
      const head = m.d0 + p * m.len;
      const tail = Math.max(m.d0, head - 18 * (0.4 + p));
      for (let s = tail; s <= head; s += 0.35) {
        const x = Math.round(RAD[0] + dx * s), y = Math.round(RAD[1] + dy * s);
        if (x < 0 || x >= cols || y < 0 || y >= HOR) continue;
        if (base[x + y * cols][0] === "█") continue;           // behind the hills
        const f = (s - tail) / Math.max(0.01, head - tail);
        const v = clamp(f * m.br * fade * (age > m.dur ? 0.6 : 1));
        if (v < 0.08) continue;
        const ch = v > 0.8 ? "█" : v > 0.55 ? "▓" : v > 0.3 ? "▒" : "░";
        g.set(x, y, ch, K("met", Math.min(7, Math.floor(v * 8))));
        // mirrored in the still lake, dimmer
        const ry = LAKE + (LAKE - y) - 2;
        if (ry >= LAKE && ry < rows && v > 0.25) g.set(x, ry, v > 0.6 ? "▒" : "░", K("met", Math.min(4, Math.floor(v * 4))));
      }
    }
    return g.frame();
  };
}
