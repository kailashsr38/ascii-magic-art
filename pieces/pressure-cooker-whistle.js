/* pressure-cooker-whistle: an aluminium pressure cooker on a gas flame builds pressure, its weight rattles and it whistles out a jet of steam, counting up to three. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract, TAU } from "../lib/kit.js";

const TILE = gradient(["#123e48", "#1a5260", "#246878", "#2e7c8c"], 5);           // 0..4
const ALU = gradient(["#4a4e56", "#6e737c", "#9aa0a8", "#c4c8ce", "#e8eaee", "#ffffff"], 10); // 5..14
const SLAB = gradient(["#141016", "#241e26", "#342c34"], 3);                       // 15..17
const NAMED = {
  grout: "#0a2a32", band: "#c85a1a", bandL: "#ffd04a", bake: "#141414", bakeL: "#3a3a3a", flame: "#2a6aff", flameL: "#8ad4ff",
  steel: "#c0c4cc", steelD: "#7a7e86", knob: "#202020", steam: "#ffffff", steamM: "#e4e8f0", steamD: "#b0b8c4",
  note: "#ffe066", noteD: "#c8a830", ink: "#2a2a6a", red: "#e83a2a", weight: "#1a1a1a", speck: "#6a5a6a",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[18 + i]));

export const meta = {
  slug: "pressure-cooker-whistle",
  name: "Pressure Cooker Whistle",
  category: "india",
  note: "An aluminium pressure cooker on a gas flame builds pressure, its weight rattles, then it whistles out a jet of steam while a note on the wall counts to three.",
  tags: ["kitchen", "cooking", "india", "steam", "home", "loader"],
  cols: 72, rows: 40, fps: 24,
  palette: palette([...TILE, ...ALU, ...SLAB, ...Object.values(NAMED)]),
};

const W = 4;               // seconds per whistle
const VX = 35, VY = 16;    // vent

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 34) {
      const n = fbm(x * 0.4, y * 0.8, 2, 2);
      bg.push(y === 34 ? ["▀", K.steelD] : n > 0.7 ? ["▓", K.speck] : ["█", KEYS[15 + Math.floor(n * 2.99)]]);
      continue;
    }
    const grout = x % 8 === 0 || y % 4 === 0;
    const bandRow = y >= 24 && y <= 27;
    if (grout) { bg.push(["▓", K.grout]); continue; }
    if (bandRow) { bg.push([((x >> 1) + y) % 3 === 0 ? "◆" : "█", ((x >> 1) + y) % 3 === 0 ? K.bandL : K.band]); continue; }
    const n = fbm(x * 0.1, y * 0.2, 2, 6);
    bg.push(["█", KEYS[Math.min(4, Math.floor(clamp(0.55 + (n - 0.5) * 0.6 - y * 0.008) * 5))]]);
  }
  const put = (x, y, ch, co) => { if (x >= 0 && y >= 0 && x < cols && y < rows) bg[x + y * cols] = [ch, co]; };
  // gas stove
  for (let x = 12; x <= 60; x++) { put(x, 32, "▄", K.steel); put(x, 33, "█", K.steelD); }
  for (const kx of [16, 54]) { put(kx, 33, "●", K.knob); }
  // cooker body
  const B0 = 22, B1 = 49, BT = 19, BB = 30;
  for (let y = BT; y <= BB; y++) for (let x = B0; x <= B1; x++) {
    const u = (x - B0) / (B1 - B0);
    const l = clamp(0.25 + 0.75 * Math.sin(u * Math.PI) ** 0.6 - (u - 0.35) * 0.4 - (y === BB ? 0.3 : 0));
    put(x, y, y === BB ? "▀" : "█", KEYS[5 + Math.min(9, Math.floor(l * 10))]);
  }
  for (let x = B0 + 1; x < B1; x++) put(x, BT + 4, "▀", KEYS[7]);
  // lid and long handle
  for (let x = B0 - 1; x <= B1 + 1; x++) { put(x, BT - 1, "▄", KEYS[11]); put(x, BT, "█", KEYS[12]); }
  for (let x = B0 + 3; x <= B1 - 3; x++) put(x, BT - 2, "▄", KEYS[13]);
  for (let x = B1 + 1; x <= B1 + 18; x++) { put(x, BT + 1, "█", K.bake); put(x, BT, "▄", K.bakeL); }
  for (let x = B1 + 4; x <= B1 + 16; x++) put(x, BT - 1, "▄", K.bake);
  put(B1 + 18, BT + 2, "▀", K.bake);
  for (let x = B0 - 8; x <= B0 - 1; x++) put(x, BT + 1, "█", K.bake);
  put(VX, VY + 1, "█", KEYS[9]); put(VX, VY + 2, "█", KEYS[9]);

  // sticky note frame (drawn each frame with the counter)
  const r = rng(6);
  const puffs = Array.from({ length: 70 }, () => ({ d: r() * 0.9, sp: 16 + r() * 10, dr: (r() - 0.5) * 2, sw: r() * 6 }));

  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const tt = t + 1, n = Math.floor(tt / W), lt = tt - n * W;
    const blowing = lt > 2.5 && lt < 3.7;
    const count = (n % 3) + (lt > 2.5 ? 1 : 0);
    // flame under the base
    for (let x = 24; x <= 47; x++) {
      const h = 1 + Math.floor((0.5 + 0.5 * Math.sin(t * 13 + x * 1.9)) * 1.6);
      for (let j = 0; j < h; j++) g.set(x, 31 - j, j === h - 1 ? "▓" : "█", j === 0 ? K.flame : K.flameL);
    }
    // weight: still, then rattling faster, then lifted while the steam blows
    const press = clamp(lt / 2.5);
    let wy = VY - 1, wx = VX;
    if (blowing) wy = VY - 2;
    else if (press > 0.5 && Math.sin(t * (20 + press * 30)) > 0.4) wx = VX + (Math.sin(t * 37) > 0 ? 1 : -1) * 0;
    const jig = !blowing && press > 0.5 && Math.sin(t * (18 + press * 40)) > 0.3;
    g.text(wx - 1, wy - (jig ? 1 : 0), "▄█▄", K.weight);
    g.text(wx - 1, wy + 1 - (jig ? 1 : 0), "▀█▀", K.weight);
    // a thin wisp before the whistle, a jet and cloud during it, drifting remains after
    for (const p of puffs) {
      const age = blowing ? lt - 2.5 - p.d * 0.9 : lt >= 3.7 ? lt - 2.5 - p.d * 0.9 : -1;
      if (age < 0 || age > 1.8) continue;
      const rise = age * p.sp * (1 - age * 0.25);
      const y = VY - 2 - rise;
      const spread = Math.max(0, rise - 2) * 0.9;
      const x = VX + p.dr * spread * 1.6 + Math.sin(age * 4 + p.sw) * age * 1.5 + age * 4;
      if (y < -1) continue;
      const ch = age < 0.35 ? "█" : age < 0.8 ? "▓" : age < 1.3 ? "▒" : "░";
      const co = age < 0.5 ? K.steam : age < 1.1 ? K.steamM : K.steamD;
      const w = Math.min(3, Math.floor(spread / 3));
      for (let k = -w; k <= w; k++) g.set(x + k, y, Math.abs(k) === w && w > 0 ? "▒" : ch, co);
      if (spread > 4) g.set(x, y + 1, "░", K.steamD);
    }
    if (!blowing && lt < 2.5) {
      for (let k = 0; k < 4; k++) {
        const ph = fract(t * 0.8 + k / 4);
        g.set(VX + Math.sin(ph * 6 + k) * 1.2 + ph * 2, VY - 2 - ph * 6 * press, ph < 0.5 ? "▒" : "░", K.steamM);
      }
    }
    if (blowing) {
      const word = "WHEEEE!";
      const nshow = Math.min(word.length, 1 + Math.floor((lt - 2.5) * 10));
      g.text(VX + 8, 5, word.slice(0, nshow), K.red);
    }
    // sticky note counting whistles, fixed width
    g.fill(2, 3, 13, 6, "█", K.note);
    g.hline(2, 14, 8, "▀", K.noteD);
    g.text(3, 4, "whistles", K.ink);
    g.text(4, 6, `${count} of 3`, K.ink);
    for (let k = 0; k < 3; k++) g.set(10 + k, 7, k < count ? "●" : "○", K.red);
    return g.frame();
  };
}
