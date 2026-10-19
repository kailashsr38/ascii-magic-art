/* dhol-baraat-drummer: a wedding procession at night, a dhol player drums and dances as the groom rides a white horse past lamp bearers, dancers and falling petals. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract, TAU } from "../lib/kit.js";

const SKY = gradient(["#05040f", "#0e0a26", "#1e1440", "#38204e", "#5a2a4a"], 8);    // 0..7
const BLD = gradient(["#0c0814", "#1a1224", "#281a30"], 3);                          // 8..10
const ROAD = gradient(["#1a1410", "#2e241a", "#463626", "#5e4a34"], 6);              // 11..16
const NAMED = {
  win: "#ffb84a", winD: "#c87a2a", bulbR: "#ff3a5a", bulbY: "#ffd84a", bulbG: "#4aff8a", bulbB: "#4aa8ff",
  horse: "#f4f0e8", horseD: "#bcb4a8", saddle: "#d01a3a", gold: "#ffcc3a", goldD: "#b8862a",
  skin: "#c07a46", skinD: "#6a3a1e", turban: "#ff7a1a", turbanL: "#ffb04a", kurta: "#ffe04a", kurtaD: "#c8a020",
  dholBody: "#b0281a", dholD: "#6a1410", rope: "#ffe8a0", headC: "#f0e0c0", headD: "#b8a88a", stick: "#f0c070",
  sher: "#f2e6c8", sherD: "#c0a880", dA: "#ff3a9a", dB: "#3ad0c0", dC: "#a04aff", dD: "#ff8a1a", pant: "#e8e0d0",
  flame: "#fff0a0", petalO: "#ff9a1a", petalP: "#ff5a9a", petalR: "#ff3030", wave: "#ffe0a0",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[17 + i]));

export const meta = {
  slug: "dhol-baraat-drummer",
  name: "Baraat Dhol Night",
  category: "india",
  note: "A wedding procession at night: a dhol player drums and dances while the groom rides a white horse past lamp bearers, dancers and falling petals.",
  tags: ["dhol", "wedding", "baraat", "india", "music", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: palette([...SKY, ...BLD, ...ROAD, ...Object.values(NAMED)]),
};

const GROUND = 26;
const BEAT = 0.32;
const BULBS = ["bulbR", "bulbY", "bulbG", "bulbB"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(8);
  // a strip of buildings 240 cells long that scrolls past
  const W = 240, bl = [];
  for (let x = 0; x < W;) { const w = 12 + Math.floor(r() * 12); bl.push({ x, w, top: 5 + Math.floor(r() * 7), c: Math.floor(r() * 3), seed: r() * 100 }); x += w; }
  const tops = new Int16Array(W), shade = new Int8Array(W), seeds = new Float32Array(W), starts = new Int16Array(W);
  for (const b of bl) for (let i = 0; i < b.w && b.x + i < W; i++) { tops[b.x + i] = b.top; shade[b.x + i] = b.c; seeds[b.x + i] = b.seed; starts[b.x + i] = b.x; }
  const petals = Array.from({ length: 46 }, () => ({ x: r() * cols, sp: 2 + r() * 3, ph: r(), c: Math.floor(r() * 3), sw: r() * 6 }));
  const dancers = [{ x: 44, c: "dA", ph: 0 }, { x: 52, c: "dB", ph: 1.7 }, { x: 60, c: "dC", ph: 3.1 }];
  const bearers = [{ x: 6, ph: 0.4 }, { x: 37, ph: 2.2 }];

  function figure(x, top, body, arms, ph, t) {
    x = Math.round(x);
    const bob = Math.sin(t * 9 + ph) > 0 ? 0 : 1, y = top + bob;
    g.text(x, y, "▄▄", K.skinD);
    g.text(x, y + 1, "██", K.skin);
    g.fill(x - 1, y + 2, 4, 4, "█", K[body]);
    g.fill(x - 1, y + 6, 4, 1, "▀", K[body]);
    const step = Math.sin(t * 9 + ph) > 0;
    g.line(x, y + 7, x - (step ? 1 : 0), GROUND + 2, "█", K.pant);
    g.line(x + 1, y + 7, x + 1 + (step ? 0 : 1), GROUND + 2, "█", K.pant);
    if (arms) {
      const wv = Math.round(Math.sin(t * 6 + ph) * 1.5);
      g.line(x - 1, y + 2, x - 3 + wv, y - 2, "█", K.skin);
      g.line(x + 2, y + 2, x + 4 + wv, y - 2, "█", K.skin);
    }
  }

  return (t) => {
    g.clear();
    // sky
    for (let y = 0; y < GROUND; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.04 + t * 0.02, y * 0.15, 2, 3);
      const v = clamp(y / 22 + (n - 0.5) * 0.35);
      g.set(x, y, n > 0.6 ? "▓" : "█", KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    // a firework every few seconds
    const fp = 3.4, fn = Math.floor(t / fp), fa = t - fn * fp;
    const fx = 30 + fract(Math.sin(fn * 7.3) * 99) * 50, fy = 5 + fract(Math.sin(fn * 3.1) * 77) * 3;
    const fcol = K[BULBS[fn % 4]];
    if (fa < 0.6) g.set(fx, GROUND - (GROUND - fy) * (fa / 0.6), "│", K.gold);
    else if (fa < 2.4) {
      const e = fa - 0.6;
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * TAU, d = 8 * (1 - Math.exp(-e * 2.5));
        g.set(fx + Math.cos(a) * d * 1.8, fy + Math.sin(a) * d * 0.8 + e * e * 1.2, e < 1.1 ? "●" : "•", e < 1.2 ? fcol : K.goldD);
      }
    }
    // buildings with lit windows and bulb strings, scrolling left
    const off = t * 3;
    for (let x = 0; x < cols; x++) {
      const wx = (((Math.floor(x + off)) % W) + W) % W;
      const top = tops[wx], lx = wx - starts[wx];
      for (let y = top; y < GROUND; y++) {
        const ly = y - top;
        const win = lx % 5 >= 1 && lx % 5 <= 2 && ly % 4 >= 2 && ly % 4 <= 3 && ly > 1;
        const lit = win && fract(Math.sin((wx * 13 + ly * 7 + seeds[wx]) * 1.3) * 999) > 0.74;
        g.set(x, y, lit ? "█" : win ? "▓" : "█", lit ? (ly % 8 < 4 ? K.win : K.winD) : KEYS[8 + shade[wx]]);
      }
      // bulb strings sagging from roof to roof
      const u = (wx % 12) / 12;
      const by = top + Math.round(1 + Math.sin(u * Math.PI) * 2);
      g.set(x, by, wx % 2 ? "●" : "▪", K[BULBS[(wx >> 1) % 4]]);
    }
    // road
    for (let y = GROUND; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm((x + t * 6) * 0.1, y * 0.4, 2, 4);
      const v = clamp(0.25 + (y - GROUND) / 14 + (n - 0.5) * 0.4);
      g.set(x, y, n > 0.6 ? "▓" : "█", KEYS[11 + Math.min(5, Math.floor(v * 6))]);
    }
    // lamp bearers with lamp frames on their heads
    for (const b of bearers) {
      const bob = Math.sin(t * 5 + b.ph) > 0 ? 0 : 1;
      figure(b.x, GROUND - 9, "sherD", false, b.ph, t);
      const y = GROUND - 12 + bob;
      g.text(b.x - 3, y, "▄▀▄▀▄▀▄▀", K.gold);
      g.text(b.x - 3, y + 1, "▀▀▀▀▀▀▀▀", K.goldD);
      for (let k = 0; k < 4; k++) g.set(b.x - 3 + k * 2, y - 1, "●", K.flame);
      g.set(b.x - 1, y + 2, "█", K.goldD); g.set(b.x + 2, y + 2, "█", K.goldD);
    }
    // the groom on a white horse, walking in place
    const hx = 14, hy = GROUND - 9;
    const gait = t * 5;
    for (let k = 0; k < 4; k++) {
      const lx = hx + [1, 4, 13, 16][k], sw = Math.round(Math.sin(gait + (k % 2) * Math.PI + (k > 1 ? 1.6 : 0)) * 1.2);
      g.line(lx, hy + 5, lx + sw, GROUND + 3, "█", k % 2 ? K.horseD : K.horse);
    }
    g.fill(hx, hy + 1, 19, 4, "█", K.horse);
    g.text(hx + 1, hy, "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄", K.horse);
    g.text(hx, hy + 5, "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀", K.horseD);
    for (let k = 0; k < 6; k++) g.text(hx + 17 + Math.floor(k / 2), hy - k, "███", K.horse);
    g.text(hx + 20, hy - 6, "████▄", K.horse); g.text(hx + 21, hy - 7, "▄", K.horse);
    g.text(hx + 23, hy - 5, "██▀", K.horse);
    g.text(hx + 18, hy - 3, "▓▓▓", K.saddle); g.text(hx + 19, hy - 2, "▀▀▀", K.gold);
    g.set(hx - 1, hy + 1, "█", K.horseD); g.set(hx - 2, hy + 2, "▓", K.horseD); g.set(hx - 2, hy + 3, "▓", K.horseD);
    g.fill(hx + 5, hy + 1, 9, 3, "▓", K.saddle);
    g.hline(hx + 5, hx + 13, hy + 4, "▀", K.gold);
    // groom: cream sherwani, gold turban with a hanging sehra of flower strings
    const gx = hx + 8;
    g.fill(gx, hy - 6, 4, 6, "█", K.sher); g.set(gx + 3, hy - 6, "▓", K.sherD);
    g.text(gx, hy - 9, "▄██▄", K.gold);
    g.text(gx, hy - 8, "████", K.skin);
    g.text(gx, hy - 7, "▌▐▌▐", K.petalO);
    g.line(gx + 3, hy - 4, gx + 6, hy - 2, "█", K.sherD);

    // dancers with arms up
    for (const d of dancers) figure(d.x, GROUND - 9, d.c, true, d.ph, t);
    // the dhol player, bouncing on the beat
    const beat = Math.floor(t / BEAT), bs = t - beat * BEAT;
    const dx = 80, bounce = bs < 0.12 ? 1 : 0, dy = GROUND - 15 + bounce;
    g.text(dx - 1, dy - 1, "▄██▄", K.turbanL);
    g.text(dx - 2, dy, "██████", K.turban);
    g.set(dx + 4, dy - 1, "▄", K.turbanL); g.set(dx + 5, dy - 2, "▄", K.turban);
    g.text(dx - 1, dy + 1, "████", K.skin); g.set(dx - 1, dy + 1, "▐", K.skinD);
    g.text(dx - 1, dy + 2, "▀██▀", K.skinD);
    g.fill(dx - 3, dy + 3, 8, 11, "█", K.kurta);
    for (let y = dy + 3; y < dy + 14; y++) g.set(dx + 4, y, "▓", K.kurtaD);
    const knee = bounce;
    g.line(dx - 2, dy + 14, dx - 3 - knee, GROUND + 6, "█", K.pant);
    g.line(dx - 1, dy + 14, dx - 2 - knee, GROUND + 6, "█", K.pant);
    g.line(dx + 2, dy + 14, dx + 3 + knee, GROUND + 6, "█", K.pant);
    g.line(dx + 3, dy + 14, dx + 4 + knee, GROUND + 6, "█", K.pant);
    // the dhol slung across the belly
    const D0 = dx - 9, D1 = dx + 9, DY = dy + 7;
    for (let x = D0 + 1; x < D1; x++) for (let y = DY - 3; y <= DY + 3; y++) {
      const v = (y - DY) / 3.4;
      const ropeOn = ((x - D0) + (y - DY) * (Math.floor((x - D0) / 3) % 2 ? 1 : -1) + 30) % 3 === 0;
      g.set(x, y, ropeOn ? "▓" : "█", ropeOn ? K.rope : Math.abs(v) > 0.7 ? K.dholD : K.dholBody);
    }
    for (const [ex, hit] of [[D0, 0], [D1, 1]]) {
      for (let y = DY - 3; y <= DY + 3; y++) g.set(ex, y, "█", Math.abs(y - DY) === 3 ? K.headD : K.headC);
      g.set(ex + (hit ? 1 : -1), DY - 4, "▄", K.headD);
    }
    // strokes: heavy stick on the right every beat, thin stick on the left off the beat
    const rHit = bs < 0.1, lHit = Math.abs(bs - BEAT / 2) < 0.06 && beat % 2 === 0;
    const rs = rHit ? [D1 + 1, DY - 1] : [D1 + 4, DY - 6];
    g.line(dx + 4, dy + 5, rs[0] + 1, rs[1], "█", K.skin);
    g.line(rs[0], rs[1], rs[0] - 1, rs[1] - 4, "█", K.stick);
    g.set(rs[0] - 1, rs[1] - 4, "▀", K.stick);
    const ls = lHit ? [D0 - 1, DY] : [D0 - 3, DY - 5];
    g.line(dx - 3, dy + 5, ls[0] - 1, ls[1] + 1, "█", K.skin);
    g.line(ls[0] - 1, ls[1], ls[0] + 1, ls[1] - 5, "│", K.stick);
    // sound waves off each head
    for (const [ex, sgn, age] of [[D1, 1, bs], [D0, -1, beat % 2 === 0 ? bs - BEAT / 2 : -1]]) {
      if (age < 0 || age > 0.28) continue;
      const rr = 2 + age * 18;
      for (let y = -3; y <= 3; y++) g.set(ex + sgn * Math.round(rr - Math.abs(y) * 0.5), DY + y, sgn > 0 ? ")" : "(", K.wave);
    }
    // marigold and rose petals thrown over everyone
    for (const p of petals) {
      const y = fract(t / (rows / p.sp) + p.ph) * rows;
      const x = p.x + Math.sin(t * 1.3 + p.sw) * 2 - t * 1.5;
      const xx = ((x % cols) + cols) % cols;
      g.set(xx, y, (Math.floor(t * 4 + p.sw) % 2) ? "▪" : "■", K[["petalO", "petalP", "petalR"][p.c]]);
    }
    return g.frame();
  };
}
