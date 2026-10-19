/* mehndi-hand-design: a henna cone traces a mandala, finger bands and wrist borders onto an open palm, then the paste dries to a deep orange stain. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, TAU } from "../lib/kit.js";

const SKIN = gradient(["#7a4426", "#a8643a", "#c8804e", "#e0a070", "#f0bc8c"], 8);   // 0..7
const CLOTH = gradient(["#2a0614", "#4a0a22", "#6e1232", "#8e1a40"], 6);             // 8..13
const NAMED = {
  paste: "#2e1206", pasteL: "#4e2410", stain: "#c2401a", stainL: "#e0602a",
  gold: "#f0c040", goldD: "#b88a20", foil: "#e8d070", foilD: "#a89040", tip: "#1a0a04", red: "#e02040",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[14 + i]));

export const meta = {
  slug: "mehndi-hand-design",
  name: "Mehndi Hand Design",
  category: "india",
  note: "A henna cone traces a palm mandala, finger bands and wrist borders on an open hand, then the paste dries and flakes to a deep orange stain.",
  tags: ["mehndi", "henna", "india", "wedding", "pattern", "hero"],
  cols: 84, rows: 38, fps: 20,
  palette: palette([...SKIN, ...CLOTH, ...Object.values(NAMED)]),
};

const FINGERS = [
  { a: [33, 17], b: [30, 5], r: 3.3 },
  { a: [39, 16], b: [39, 2], r: 3.4 },
  { a: [45, 16], b: [47, 3], r: 3.3 },
  { a: [51, 18], b: [55, 8], r: 3.0 },
  { a: [31, 26], b: [20, 16], r: 3.6 },  // thumb
];
const PC = [42, 24];

function capsule(x, y, f) {
  const px = x, py = y * 2, ax = f.a[0], ay = f.a[1] * 2, bx = f.b[0], by = f.b[1] * 2;
  const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
  const h = clamp(((px - ax) * vx + (py - ay) * vy) / L2);
  const dx = px - ax - vx * h, dy = py - ay - vy * h;
  return { h, d: Math.hypot(dx, dy), side: (dx * vy - dy * vx) / Math.sqrt(L2) };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const inHand = new Uint8Array(N);
  const inside = (x, y) => {
    const ex = (x - PC[0]) / 13.5, ey = (y - PC[1]) / 8;
    if (ex * ex + ey * ey < 1) return true;
    if (y >= 26 && x >= 33 - (y - 26) * 0.1 && x <= 51 + (y - 26) * 0.1) return true;
    for (const f of FINGERS) if (capsule(x, y, f).d < f.r) return true;
    return false;
  };
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (inside(x + 0.5, y + 0.5)) inHand[x + y * cols] = 1;
  // static layer: cloth with gold motifs, shaded hand
  const base = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = x + y * cols;
    if (inHand[i]) {
      let e = 0;
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0]]) {
        const xx = x + ox, yy = y + oy;
        if (xx < 0 || yy < 0 || xx >= cols || yy >= rows || !inHand[xx + yy * cols]) e++;
      }
      const n = fbm(x * 0.15, y * 0.3, 2, 9);
      const v = clamp(0.78 - e * 0.14 + (n - 0.5) * 0.25 - (x - 42) * 0.006);
      base.push([e > 1 ? "▓" : "█", KEYS[Math.min(7, Math.floor(v * 8))]]);
    } else {
      const n = fbm(x * 0.08, y * 0.18, 3, 2);
      const motif = (x % 10 === 5 && y % 6 === 3) || (x % 10 === 0 && y % 6 === 0);
      if (motif) base.push(["◆", K.goldD]);
      else if (y === rows - 1 || y === rows - 2) base.push(["▓", K.goldD]);
      else base.push([n > 0.55 ? "▓" : "█", KEYS[8 + Math.min(5, Math.floor(clamp(0.3 + (n - 0.5) * 1.1) * 6))]]);
    }
  }
  // the stroke order of the design
  const strokes = [], used = new Uint8Array(N);
  const add = (x, y, ch) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const i = x + y * cols;
    if (!inHand[i] || used[i]) return;
    used[i] = 1; strokes.push([x, y, ch]);
  };
  const ring = (r, ch, step = 1) => {
    const n = Math.ceil(r * 7);
    for (let k = 0; k < n; k += step) { const a = (k / n) * TAU - Math.PI / 2; add(PC[0] + Math.cos(a) * r, PC[1] + Math.sin(a) * r * 0.5, typeof ch === "function" ? ch(k) : ch); }
  };
  add(PC[0], PC[1], "●");
  ring(1.6, "█"); ring(3, "•"); ring(4.5, "○");
  for (let p = 0; p < 8; p++) {                       // petals
    const a = (p / 8) * TAU - Math.PI / 2;
    for (let r = 5.5; r <= 8.5; r += 0.5) {
      const w = Math.sin(((r - 5.5) / 3) * Math.PI) * 0.22;
      add(PC[0] + Math.cos(a - w) * r, PC[1] + Math.sin(a - w) * r * 0.5, "▓");
      add(PC[0] + Math.cos(a + w) * r, PC[1] + Math.sin(a + w) * r * 0.5, "▓");
    }
    add(PC[0] + Math.cos(a) * 9.3, PC[1] + Math.sin(a) * 9.3 * 0.5, "◆");
  }
  ring(10.8, (k) => (k % 2 ? "▄" : "▀"));
  ring(12.2, "·", 2);
  // fingers: solid tip, a band, a row of dots, a lattice band, a small diamond
  for (const f of FINGERS) {
    const cells = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = capsule(x + 0.5, y + 0.5, f);
      if (c.d < f.r) cells.push([x, y, c]);
    }
    cells.sort((p, q) => q[2].h - p[2].h || p[0] - q[0]);
    for (const [x, y, c] of cells) if (c.h > 0.86) add(x, y, "█");
    for (const [x, y, c] of cells) if (Math.abs(c.h - 0.74) < 0.035) add(x, y, "━");
    for (const [x, y, c] of cells) if (c.h < 0.7 && c.h > 0.5 && Math.abs(c.side) < 1.1) add(x, y, "•");
    for (const [x, y, c] of cells) if (Math.abs(c.h - 0.45) < 0.035) add(x, y, "━");
    for (const [x, y, c] of cells) if (c.h < 0.42 && c.h > 0.28) add(x, y, (x + y) % 2 ? "╳" : " ");
    for (const [x, y, c] of cells) if (Math.abs(c.h - 0.2) < 0.04 && Math.abs(c.side) < 1.2) add(x, y, "◆");
  }
  // wrist borders
  for (const [y, f] of [[30, (x) => (x % 2 ? "▄" : "▀")], [31, (x) => (x % 3 === 0 ? "◆" : "·")], [32, (x) => (x % 2 ? "▀" : "▄")], [34, () => "━"], [35, (x) => (x % 2 ? "•" : " ")], [36, () => "━"]]) {
    for (let x = 30; x < 55; x++) add(x, y, f(x));
  }
  const S = strokes.length;
  const flake = new Float32Array(S);
  const r = rng(31);
  for (let k = 0; k < S; k++) flake[k] = r();

  const P = 18, DRAW = 11;
  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = base[i][0]; g.co[i] = base[i][1]; }
    const lt = (t + 5) % P;
    const shown = lt < DRAW ? Math.floor((lt / DRAW) * S) : S;
    const dry = clamp((lt - 13) / 2), gone = clamp((lt - 16.6) / 1.2);
    for (let k = 0; k < shown; k++) {
      const [x, y, ch] = strokes[k];
      if (ch === " ") continue;
      if (flake[k] < gone) continue;
      const stained = flake[k] < dry;
      g.set(x, y, ch, stained ? (ch === "█" || ch === "▓" ? K.stain : K.stainL) : (k > shown - 6 && lt < DRAW ? K.pasteL : K.paste));
    }
    if (lt < DRAW && shown > 0) {
      const [x, y] = strokes[Math.min(S - 1, shown - 1)];
      g.set(x + 1, y - 1, "▼", K.tip);
      for (let k = 0; k < 7; k++) {
        g.set(x + 2 + k, y - 2 - Math.floor(k * 0.6), "█", k % 3 === 1 ? K.foilD : K.foil);
        g.set(x + 3 + k, y - 2 - Math.floor(k * 0.6), k < 5 ? "█" : "▀", k % 2 ? K.foil : K.gold);
      }
      g.set(x + 10, y - 7, "▄", K.red);
    }
    return g.frame();
  };
}
