/* vinyl-crate-digging: a hand flipping through records in a wooden crate, each sleeve tipping forward to reveal the next cover. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SHOP = add(gradient(["#0c0a0e", "#16121a", "#221a26"], 3));
const WOOD = add(gradient(["#3a1e0c", "#5e3418", "#865026", "#a86a34", "#c88a4a"], 5));
const ART = add([
  "#ff5a3a", "#ffd23a", "#1a2a5a", // 0
  "#3ad8c8", "#0e3a4a", "#f4ecd8", // 1
  "#e83a8a", "#2a0e3a", "#ff9ad0", // 2
  "#f0e6c8", "#1a1a1a", "#d8342e", // 3
  "#5aff8a", "#0e2a1a", "#c8f05a", // 4
  "#3a8aff", "#f4f4f0", "#ff8a3a", // 5
  "#ffb03a", "#5a1a0e", "#ffe8a0", // 6
  "#9a5aff", "#ffd8f0", "#1a0e2a", // 7
]);
const SLEEVE = add(["#e8e2d4", "#a8a090", "#2a2a2e", "#5a5a60"]);
const SKIN = add(["#a05c3c", "#c8805a", "#e6a27c"]);
const UI = add(["#ff6a2a", "#ffffff", "#1a1a1a"]);

export const meta = {
  slug: "vinyl-crate-digging",
  name: "Vinyl Crate Digging",
  category: "music",
  note: "A hand digs through a wooden crate of records, tipping each sleeve forward to reveal the next bold cover with its price sticker.",
  tags: ["vinyl", "records", "crate digging", "record shop", "retro", "hero"],
  cols: 96, rows: 32, fps: 30,
  palette: palette(P),
};

const N = 24, CW = 44, CH = 20, X0 = 26, Y0 = 4, FLIP = 1.7;
const TITLES = ["NIGHT SWIM", "LOW SUN", "STATIC", "GLASS CITY", "SLOW WAVES", "PARADE", "FAR NORTH", "SOFT RIOT"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(21);
  const recs = Array.from({ length: N }, (_, i) => ({ style: i % 6, pal: (i * 5) % 8, title: TITLES[(i * 3) % 8], price: 4 + Math.floor(R() * 12), seed: R() * 10 }));
  const shop = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    // shelves of spines behind
    const shelf = y % 8 === 7;
    const sp = Math.floor(x / 2) * 7 + Math.floor(y / 8) * 13;
    const v = clamp(0.3 + (fbm(x * 0.1, y * 0.2, 2) - 0.5) * 0.4);
    shop.push(shelf ? ["▀", KEYS[WOOD + 1]] : x % 2 ? ["▌", KEYS[ART + (sp % 24)]] : ["▒", KEYS[SHOP + Math.min(2, Math.floor(v * 3))]]);
  }
  const art = (r, u, v) => {
    const a = ART + r.pal * 3;
    const c0 = KEYS[a], c1 = KEYS[a + 1], c2 = KEYS[a + 2];
    switch (r.style) {
      case 0: { const d = Math.hypot((u - 0.5) * 2, (v - 0.45) * 2); return d < 0.55 ? ["█", c0] : v > 0.62 ? ["▓", c2] : ["█", c1]; }
      case 1: return Math.floor((u + v) * 7 + r.seed) % 2 ? ["█", c0] : ["█", c1];
      case 2: { const m = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)); return Math.floor(m * 10) % 2 ? ["█", c0] : ["█", c2]; }
      case 3: return (Math.floor(u * 8) + Math.floor(v * 8)) % 2 ? ["█", c0] : ["▓", c1];
      case 4: return Math.sin(u * 12 + Math.floor(v * 7) * 1.3) * 0.3 + (v * 7 % 1) > 0.6 ? ["█", c0] : ["█", c1];
      default: return u < 0.5 ? (v < 0.5 ? ["█", c0] : ["█", c2]) : (v < 0.5 ? ["█", c1] : ["▓", c0]);
    }
  };
  const drawCover = (r, top, h, full) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < CW; x++) {
      const v = h > 1 ? y / (h - 1) : 0;
      const [ch, co] = art(r, x / (CW - 1), v);
      g.set(X0 + x, top + y, ch, co);
    }
    if (full) {
      g.fill(X0 + 2, top + h - 4, r.title.length + 2, 1, "█", KEYS[UI + 2]);
      g.text(X0 + 3, top + h - 4, r.title, KEYS[UI + 1]);
      const pr = ("$" + r.price).padEnd(3);
      g.text(X0 + CW - 8, top + 1, "▄▄▄▄▄▄", KEYS[UI]);
      g.text(X0 + CW - 8, top + 2, "█" + pr + " █", KEYS[UI]);
      g.text(X0 + CW - 7, top + 2, pr, KEYS[UI + 1]);
      g.text(X0 + CW - 8, top + 3, "▀▀▀▀▀▀", KEYS[UI]);
    }
  };
  return (t) => {
    for (let i = 0; i < shop.length; i++) { g.ch[i] = shop[i][0]; g.co[i] = shop[i][1]; }
    const n = Math.floor(t / FLIP), f = (t % FLIP) / FLIP;
    const cur = n % N, nxt = (n + 1) % N;
    const tip = smooth(clamp((f - 0.45) / 0.4));
    // records further back peeking above
    for (let d = 4; d >= 1; d--) {
      const r = recs[(cur + d) % N];
      const top = Y0 - d + (d === 1 ? 0 : 0);
      drawCover(r, top, CH, false);
    }
    // the record about to be seen sits upright behind the current one
    drawCover(recs[nxt], Y0, CH, true);
    // current record tips forward toward us
    const h = Math.max(2, Math.round(CH * (1 - tip * 0.88)));
    const top = Y0 + (CH - h);
    if (tip < 1) {
      drawCover(recs[cur], top, h, h > CH - 2);
      if (tip > 0) g.hline(X0, X0 + CW - 1, top, "▀", KEYS[SLEEVE]);
    }
    // flipped sleeves leaning in front: their backs
    for (let k = 0; k < 3; k++) {
      const y = Y0 + CH - 2 + k;
      const back = recs[(cur - k - (tip >= 1 ? 0 : 1) + N * 2) % N];
      for (let x = 0; x < CW; x++) g.set(X0 + x, y, x % 9 === 4 ? "▒" : "█", KEYS[SLEEVE + (k % 2 ? 1 : 0)]);
      g.text(X0 + 2, y, back.title.slice(0, 10), KEYS[SLEEVE + 2]);
    }
    // crate
    for (let y = 23; y < rows; y++) for (let x = 14; x < 82; x++) {
      const plank = (y - 23) % 3 === 2;
      const hole = y >= 25 && y <= 26 && x >= 42 && x <= 53;
      const v = clamp(0.55 + (fbm(x * 0.05, y * 0.9, 2, 4) - 0.5) * 0.6 - (plank ? 0.35 : 0) - (x < 16 || x > 79 ? 0.2 : 0));
      g.set(x, y, hole ? "█" : plank ? "▄" : "█", hole ? KEYS[SHOP] : KEYS[WOOD + Math.min(4, Math.floor(v * 5))]);
    }
    for (let y = 14; y < 23; y++) { for (const sx of [14, 15, 80, 81]) g.set(sx, y, "█", KEYS[WOOD + (sx < 20 ? 2 : 1)]); }
    // hand on the top edge of the record in play
    const hy = tip < 1 ? top : Y0;
    const hx = X0 + CW / 2 + 4 + Math.sin(t * 0.7) * 2;
    const hxi = Math.round(hx);
    for (let y = 0; y < hy; y++) {
      const w = y >= hy - 3 ? 5 : 3;
      for (let x = -w; x <= w; x++) g.set(hxi + x, y, "█", KEYS[SKIN + (Math.abs(x) === w ? 0 : x < 0 ? 1 : 2)]);
    }
    for (let k = -4; k <= 4; k += 2) g.set(hxi + k, hy - 1, "▄", KEYS[SKIN]);
    g.text(hxi - 5, hy, "▀▀▀▀▀▀▀▀▀▀▀", KEYS[SKIN + 1]);
    return g.frame();
  };
}
