/* dosa-tawa-spread: seen from above, a ladle spirals batter thin across a hot iron tawa, it crisps from cream to gold, is rolled up and slid off. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng, fract, TAU, lerp } from "../lib/kit.js";

const IRON = gradient(["#0c0c0e", "#18181c", "#26262c", "#363640", "#4a4a56"], 8);       // 0..7
const DOSA = gradient(["#f6eed8", "#f0dca4", "#e8c070", "#d89a44", "#b8702a", "#8a4a1a"], 12); // 8..19
const GRAN = gradient(["#141018", "#221c24", "#302830"], 3);                            // 20..22
const NAMED = {
  speck: "#8a7a8a", flame: "#3a7aff", flameL: "#8ad0ff", steel: "#d8dce4", steelD: "#8a909a", steelL: "#ffffff",
  chut: "#f2f0e0", chutG: "#4ac04a", samb: "#d8702a", sambD: "#9a4418", bowl: "#c0c4cc", ghee: "#ffd24a",
  steam: "#f4f4f8", steamD: "#a8a8b8", drop: "#cfe8ff", leaf: "#2a8a3a", leafD: "#1a5a24",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[23 + i]));

export const meta = {
  slug: "dosa-tawa-spread",
  name: "Dosa On The Tawa",
  category: "india",
  note: "Seen from above, a ladle spirals batter thin across a hot iron tawa, the dosa crisps from cream to gold with ghee at the rim, then is rolled up and slid off.",
  tags: ["dosa", "food", "india", "cooking", "breakfast", "loader"],
  cols: 90, rows: 34, fps: 20,
  palette: palette([...IRON, ...DOSA, ...GRAN, ...Object.values(NAMED)]),
};

const CX = 45, CY = 17, TR = 31, DR = 26;
const P = 13;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const bg = [], rad = new Float32Array(N), angF = new Float32Array(N), rough = new Float32Array(N), lace = new Float32Array(N);
  const r = rng(4);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = x + y * cols;
    const dx = x - CX, dy = (y - CY) * 2;
    const rr = Math.hypot(dx, dy);
    rad[i] = rr; angF[i] = fract(Math.atan2(dy, dx) / TAU + 1);
    rough[i] = (fbm(x * 0.3, y * 0.6, 2, 3) - 0.5) * 3;
    lace[i] = fbm(x * 0.45, y * 0.9, 3, 11);
    if (rr < TR) {
      const l = clamp(0.35 - (dx + dy) / (TR * 6) + (rr > TR - 2 ? 0.25 : 0) + (fbm(x * 0.2, y * 0.4, 2, 5) - 0.5) * 0.2);
      bg.push([rr > TR - 1.2 ? "▓" : "█", KEYS[Math.min(7, Math.floor(l * 8))]]);
    } else {
      const n = r();
      bg.push(n > 0.93 ? ["▪", K.speck] : [n > 0.5 ? "▓" : "█", KEYS[20 + Math.floor(n * 3)]]);
    }
  }
  const put = (x, y, ch, co) => { if (x >= 0 && y >= 0 && x < cols && y < rows) bg[x + y * cols] = [ch, co]; };
  const disc = (cx, cy, rx, fn) => {
    for (let y = Math.floor(cy - rx / 2) - 1; y <= cy + rx / 2 + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= cx + rx + 1; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 2) / rx;
      if (d <= 1) { const v = fn(d, x, y); if (v) put(x, y, v[0], v[1]); }
    }
  };
  // chutney and sambar bowls in the corners, a curry leaf sprig
  disc(84, 3, 11, (d, x, y) => (d > 0.82 ? ["█", K.bowl] : [(x * 7 + y * 3) % 5 === 0 ? "▓" : "█", (x * 7 + y * 3) % 5 === 0 ? K.chutG : K.chut]));
  disc(5, 30, 12, (d, x, y) => (d > 0.84 ? ["█", K.bowl] : [(x + y) % 4 === 0 ? "▓" : "█", (x * 3 + y) % 6 === 0 ? K.sambD : K.samb]));
  for (let k = 0; k < 5; k++) { put(80 + k * 2, 30 - k, "█", K.leaf); put(81 + k * 2, 30 - k, "▓", K.leafD); }

  const steam = Array.from({ length: 30 }, () => ({ a: r() * TAU, d: r() * 22, ph: r(), sp: 0.6 + r() * 0.5 }));

  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const n = Math.floor(t / P), lt = t - n * P;
    // flames licking out from under the rim
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU;
      const h = 1 + Math.floor((0.5 + 0.5 * Math.sin(t * 11 + k * 2.3)) * 2.2);
      for (let j = 0; j < h; j++) {
        const rr = TR + 0.6 + j;
        g.set(CX + Math.cos(a) * rr, CY + (Math.sin(a) * rr) / 2, j === h - 1 ? "▓" : "█", j === 0 ? K.flame : K.flameL);
      }
    }
    // batter coverage
    let ladle = null, foldX = -999, gone = false;
    const turns = 4;
    if (lt < 0.8) ladle = [CX, CY];
    let cook = clamp((lt - 4.2) / 5);
    if (lt >= 9.5 && lt < 11) foldX = lerp(CX - DR - 1, CX + 12, (lt - 9.5) / 1.5);
    let slide = 0;
    if (lt >= 11 && lt < 12.2) { foldX = CX + 12; slide = (lt - 11) / 1.2 * 50; }
    if (lt >= 12.2) gone = true;
    const u = lt < 0.8 ? 0 : clamp((lt - 0.8) / 3.6) * turns;
    if (lt >= 0.8 && lt < 4.4) {
      const rr = 4 + (DR - 4) * (u / turns), a = u * TAU;
      ladle = [CX + Math.cos(a) * rr, CY + (Math.sin(a) * rr) / 2];
    }
    if (!gone) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols, rr = rad[i] + rough[i] * (rad[i] > 8 ? 1 : 0.3);
      if (rr > DR + 1.5) continue;
      let cov;
      if (lt < 0.8) cov = rr < 4 * (lt / 0.8) + 1;
      else {
        const f = angF[i];
        const reach = u > f ? 4 + ((DR - 4) * (u - f)) / turns + 2.5 : 4.5;
        cov = rr < Math.min(DR + 1, reach);
      }
      if (!cov || x < foldX) continue;
      // cooking: the thin rim browns first, lace holes open as it crisps
      const edge = clamp((rr - 6) / DR);
      const c = clamp(cook * (0.75 + edge * 0.6) + (lace[i] - 0.5) * 0.35 * cook);
      const lv = Math.min(11, Math.floor(c * 11.99));
      let ch = "█";
      if (c > 0.45 && lace[i] > 0.66) ch = "▒";
      else if (c > 0.3 && lace[i] > 0.58) ch = "▓";
      if (rr > DR - 0.5) { ch = "▓"; }
      g.set(x, y, ch, KEYS[8 + Math.max(0, lv)]);
    }
    // ghee drizzled round the rim
    if (lt > 5 && lt < 9.4) {
      const k0 = Math.min(36, Math.floor((lt - 5) * 30));
      for (let k = 0; k < k0; k++) {
        const a = (k / 36) * TAU;
        g.set(CX + Math.cos(a) * (DR - 1.5), CY + (Math.sin(a) * (DR - 1.5)) / 2, "●", K.ghee);
      }
    }
    // the rolled dosa at the fold, sliding off to the right
    if (foldX > -999 && !gone) {
      const fx = Math.round(foldX + slide);
      const half = Math.sqrt(Math.max(0, 1 - ((foldX - CX) / (DR + 1)) ** 2)) * (DR + 1) / 2;
      const span = Math.max(half, 7);
      for (let y = Math.round(CY - span); y <= Math.round(CY + span); y++) {
        g.set(fx - 3, y, "█", KEYS[17]);
        g.set(fx - 2, y, "█", KEYS[15]);
        g.set(fx - 1, y, "█", KEYS[13]);
        g.set(fx, y, "█", KEYS[16]);
      }
      // spatula pushing the roll
      const sx = fx - 5;
      for (let y = CY - 3; y <= CY + 3; y++) g.text(sx - 1, y, "██", y === CY - 3 ? K.steelL : K.steel);
      g.line(sx - 2, CY, sx - 22, CY + 14, "█", K.steelD);
    }
    // water sprinkled on the bare tawa sizzles
    if (lt > 12.2 || lt < 0.25) {
      const rs = rng(n * 7 + 1);
      for (let k = 0; k < 26; k++) {
        const a = rs() * TAU, d = rs() * DR, ph = fract(lt * 2 + rs());
        g.set(CX + Math.cos(a) * d, CY + (Math.sin(a) * d) / 2 - ph * 2, ph < 0.5 ? "●" : "•", ph < 0.5 ? K.drop : K.steamD);
      }
    }
    // steam rising while it cooks
    if (cook > 0.05 && foldX === -999) for (const s of steam) {
      const ph = fract(lt * s.sp * 0.5 + s.ph);
      const x = CX + Math.cos(s.a) * s.d + ph * 6, y = CY + (Math.sin(s.a) * s.d) / 2 - ph * 9;
      g.set(x, y, ph < 0.5 ? "▓" : "▒", ph < 0.5 ? K.steam : K.steamD);
    }
    // the ladle
    if (ladle) {
      const [lx, ly] = ladle;
      g.text(Math.round(lx) - 2, Math.round(ly) - 1, "▄██▄", K.steel);
      g.text(Math.round(lx) - 2, Math.round(ly), "████", K.steelD);
      g.text(Math.round(lx) - 1, Math.round(ly) - 1, "▄", K.steelL);
      g.line(lx + 2, ly - 1, cols + 2, -4, "█", K.steelD);
    }
    return g.frame();
  };
}
