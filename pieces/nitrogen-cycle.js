/* nitrogen-cycle: nitrogen moving from the air through bacteria, soil, plants and animals and back again. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#16305a", "#24477a", "#3a6498", "#5a86b4"], 4));
add("soil", gradient(["#24160c", "#322012", "#402a18", "#4e341e"], 4));
add("grass", ["#3a7a2a", "#5aa040"]);
add("plant", ["#2a8a3a", "#5ac85a", "#9ae07a"]);
add("stem", ["#4a7a2a"]);
add("root", ["#d8c8a8"]);
add("nod", ["#ff7ab0"]);
add("rab", ["#c8b8a8", "#f0e8e0"]);
add("bolt", ["#fff6a0"]);
add("n2", ["#c8d8f0", "#ffffff"]);
add("tok", ["#ffd166", "#7ee787", "#79c0ff", "#ff7b72", "#d2a8ff", "#ffa657"]);
add("ui", ["#ffffff", "#c9d1d9", "#8b949e"]);

export const meta = {
  slug: "nitrogen-cycle",
  name: "Nitrogen Cycle",
  category: "science",
  note: "Nitrogen gas is fixed by bacteria in root nodules, turned into ammonium, nitrite and nitrate in the soil, taken up by plants, eaten, decomposed and finally returned to the air.",
  tags: ["nitrogen-cycle", "ecology", "biology", "soil", "education", "science"],
  cols: 100, rows: 32, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const GROUND = 12;

function poly(pts) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], (pts[i][1] - pts[i - 1][1]) * 2));
  const tot = L[L.length - 1];
  const at = (p) => {
    const d = p * tot;
    let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
  };
  return { pts, tot, at };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.12, y * 0.3, 3, 33);
  const BOX = [
    { x: 30, y: 0, w: 40, h: 3, s: "N2  nitrogen gas, 78% of air" },
    { x: 22, y: 17, w: 17, h: 3, s: "AMMONIUM NH4+" },
    { x: 40, y: 26, w: 16, h: 3, s: "NITRITE NO2-" },
    { x: 58, y: 17, w: 16, h: 3, s: "NITRATE NO3-" },
    { x: 79, y: 17, w: 17, h: 3, s: "DEAD MATTER" },
  ];
  const ARROWS = [
    [poly([[29, 1], [16, 6], [12, 16]]), 0, "fixation by bacteria", 15, 4],
    [poly([[14, 18], [21, 18]]), 0, "", 0, 0],
    [poly([[30, 20], [33, 25], [39, 27]]), 1, "nitrification", 18, 24],
    [poly([[56, 27], [61, 24], [64, 20]]), 1, "nitrification", 60, 25],
    [poly([[60, 16], [54, 14], [51, 11]]), 2, "absorbed", 54, 14],
    [poly([[54, 7], [64, 7], [72, 8]]), 5, "eaten", 60, 6],
    [poly([[84, 12], [86, 16]]), 3, "die, waste", 88, 13],
    [poly([[85, 20], [85, 23], [36, 23], [34, 20]]), 4, "decomposers", 60, 22],
    [poly([[70, 16], [72, 10], [70, 3]]), 2, "denitrifying bacteria", 74, 4],
  ];
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      if (y < GROUND) g.set(x, y, v > 0.6 ? "▒" : "░", K("sky", Math.min(3, Math.floor(y * 0.25 + v * 1.5))));
      else if (y === GROUND) g.set(x, y, v > 0.5 ? "▀" : "█", K("grass", v > 0.5 ? 1 : 0));
      else g.set(x, y, v > 0.55 ? "▓" : "▒", K("soil", Math.min(3, Math.floor(v * 4))));
    }
    // N2 molecules drifting in the sky
    for (let k = 0; k < 7; k++) {
      const x = Math.round(fract(t * 0.02 + k * 0.143) * 104) - 4, y = 4 + ((k * 3) % 6);
      g.text(x, y, "N≡N", K("n2", k & 1));
    }
    // lightning now and then
    const lf = fract(t / 7);
    if (lf < 0.08) {
      const B = [[5, 3], [4, 4], [6, 5], [5, 6], [7, 7], [6, 8], [8, 9], [7, 10], [8, 11]];
      for (const [x, y] of B) g.set(x, y, "█", K("bolt"));
    }
    g.text(1, 1, "lightning", K("ui", 2)); g.text(1, 2, "fixes a little", K("ui", 2));
    // legume with root nodules
    for (let y = 5; y < GROUND; y++) g.set(10, y, "┃", K("stem"));
    for (const [dx, dy] of [[-2, 5], [2, 6], [-2, 8], [2, 9], [0, 4]]) g.text(10 + dx - (dx < 0 ? 1 : 0), dy, dx === 0 ? "▲" : dx < 0 ? "◀█" : "█▶", K("plant", 1));
    for (let y = GROUND + 1; y < 21; y++) { g.set(10, y, "│", K("root")); if (y > 14 && y % 2) { g.set(8, y, "╱", K("root")); g.set(12, y, "╲", K("root")); } }
    for (const [x, y] of [[9, 16], [11, 17], [8, 18], [12, 19], [10, 20]]) g.set(x, y, "●", K("nod"));
    g.text(1, 13, "legume", K("ui", 1)); g.text(1, 14, "root", K("ui", 2)); g.text(1, 15, "nodules", K("ui", 2));
    // crop plant
    for (let y = 4; y <= GROUND + 3; y++) g.set(50, y, y > GROUND ? "│" : "┃", y > GROUND ? K("root") : K("stem"));
    for (const [dx, dy] of [[-3, 5], [3, 6], [-3, 8], [3, 9]]) g.text(50 + (dx < 0 ? dx : 1), dy, dx < 0 ? "▄██" : "██▄", K("plant", 0));
    g.text(49, 3, "▄▲▄", K("plant", 2));
    g.text(40, 10, "PLANTS", K("ui", 0));
    // rabbit
    g.text(76, 8, "(\\_/)", K("rab", 1));
    g.text(76, 9, "(o.o)", K("rab", 1));
    g.text(75, 10, "(\")_(\")", K("rab", 0));
    g.text(83, 9, "ANIMALS", K("ui", 0));
    // boxes
    for (const b of BOX) {
      g.fill(b.x + 1, b.y + 1, b.w - 2, b.h - 2, " ");
      g.box(b.x, b.y, b.w, b.h, "round", K("ui", 2));
      g.text(b.x + Math.floor((b.w - b.s.length) / 2), b.y + 1, b.s, K("ui", 0));
    }
    // arrows with travelling tokens
    for (const [P, c, label, lx, ly] of ARROWS) {
      const n = Math.ceil(P.tot);
      for (let i = 0; i <= n; i += 2) { const [x, y] = P.at(i / n); if (g.get(x, y) !== "█" || true) g.set(x, y, "·", K("tok", c)); }
      const [ex, ey] = P.at(1);
      const [px, py] = P.at(0.94);
      g.set(ex, ey, Math.abs(ex - px) * 0.5 > Math.abs(ey - py) ? (ex > px ? "►" : "◄") : ey > py ? "▼" : "▲", K("tok", c));
      for (let k = 0; k < 2; k++) { const [x, y] = P.at(fract(t * (12 / P.tot) + k * 0.5)); g.set(x, y, "●", K("tok", c)); }
      if (label) g.text(lx, ly, label, K("tok", c));
    }
    g.text(1, 30, "Bacteria do most of the work: they fix, convert and release nitrogen.", K("ui", 1));
    g.text(1, 31, "Plants need nitrogen to build proteins and DNA.", K("ui", 2));
    g.text(cols - 15, 30, "NITROGEN CYCLE", K("ui", 0));
    return g.frame();
  };
}
