/* traffic-light: a street crossing where the signal cycles and cars stop, queue and pull away. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const SKY = gradient(["#1a2a52", "#3a5a96", "#7aa6d6", "#b8d6ee"], 8);   // 0-7
const BLD = gradient(["#20263a", "#323a54", "#46506e"], 4);              // 8-b
const pal = palette([
  ...SKY, ...BLD,
  "#ffe08a", "#3a3f4a", "#2a2d34", "#4a4f5a", "#e8e8e8", "#ffd23f", // c window, d road, e road dark, f kerb, g paint white, h paint yellow
  "#ff3b3b", "#ffb21e", "#3bff7a", "#4a1414", "#4a3a10", "#103a1e", // i red on, j amber on, k green on, l red off, m amber off, n green off
  "#1a1c22", "#5a5e68",                                             // o housing, p pole
  "#e8443a", "#3a8cff", "#ffd23f", "#f2f2f2", "#38c172", "#ff8a3a", // q-v car bodies
  "#9ad4ff", "#111111", "#fff6c8", "#ff4040",                       // w glass, x tyre, y headlight, z tail
  "#6a7080",                                                        // A pavement
]);

export const meta = {
  slug: "traffic-light",
  name: "Traffic Light",
  category: "things",
  note: "A street crossing where the signal cycles green, amber and red while cars stop, queue and pull away.",
  tags: ["city", "street", "cars", "traffic", "hero"],
  cols: 92, rows: 34, fps: 24,
  palette: pal,
};

const P = 12, GREEN = 5, AMBER = 7;
const lightAt = (tt) => { const c = ((tt % P) + P) % P; return c < GREEN ? 2 : c < AMBER ? 1 : 0; };
const CAR = ["   ▄▄▄▄▄▄   ", "  ▐▓▓█▓▓▌▄▄ ", " ██████████▌", "  ●▀▀▀▀▀●   "];
const MASK = ["   bbbbbb   ", "  bwwbwwbbb ", " bbbbbbbbbbh", "  xbbbbbx   "];
const mirror = (s) => [...s].reverse().map((c) => ({ "▐": "▌", "▌": "▐" }[c] || c)).join("");
const CARL = CAR.map(mirror), MASKL = MASK.map((m) => [...m].reverse().join(""));
const BODY = "qrstuv";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(11);
  // buildings
  const bld = [];
  for (let x = 0; x < cols;) { const w = 6 + Math.floor(r() * 9); bld.push([x, w, 3 + Math.floor(r() * 9), Math.floor(r() * 3)]); x += w + 1; }
  const lit = Array.from({ length: cols * 20 }, () => r() > 0.55);
  const lanes = [
    { dir: 1, y: 25, stop: 67, spawns: [0.4, 2.3, 3.9, 7.6, 8.8, 10.4], len: 12 },
    { dir: -1, y: 19, stop: cols + 13 - 65, spawns: [1.2, 3.1, 6.4, 8.1, 9.7], len: 12 },
  ];
  const simulate = (t) => {
    const out = [];
    for (const L of lanes) {
      const t0 = (Math.floor(t / P) - 2) * P;
      const cars = [];
      const dt = 0.05;
      let si = 0;
      const sp = [];
      for (let c = t0; c <= t; c += P) for (const s of L.spawns) if (c + s <= t) sp.push(c + s);
      sp.sort((a, b) => a - b);
      for (let tt = t0; tt <= t + 1e-6; tt += dt) {
        while (si < sp.length && sp[si] <= tt) { cars.push({ s: 0, v: 12, id: Math.round(sp[si] * 10) }); si++; }
        const light = lightAt(tt);
        for (let i = 0; i < cars.length; i++) {
          const c = cars[i];
          let allowed = 1e9;
          if (i > 0) allowed = cars[i - 1].s - L.len - 2;
          if (light !== 2 && c.s <= L.stop + 0.01) {
            const dist = L.stop - c.s;
            if (!(light === 1 && dist < 2.5)) allowed = Math.min(allowed, L.stop);
          }
          const room = Math.max(0, allowed - c.s);
          c.v = Math.min(14, c.v + 20 * dt, Math.sqrt(2 * 28 * room));
          c.s = Math.min(c.s + c.v * dt, Math.max(c.s, allowed));
        }
        while (cars.length && cars[0].s > cols + 30) cars.shift();
      }
      for (const c of cars) out.push([L, c]);
    }
    return out;
  };
  return (t) => {
    // sky and buildings
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / 16 + (fbm(x * 0.05 + t * 0.02, y * 0.3, 3) - 0.5) * 0.3);
      g.set(x, y, v > 0.5 ? "▒" : "░", KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    for (const [bx, bw, top, shade] of bld) for (let y = top; y < 17; y++) for (let x = bx; x < bx + bw && x < cols; x++) {
      const win = (x - bx) % 3 === 1 && (y - top) % 2 === 1 && x < bx + bw - 1;
      g.set(x, y, win ? "▪" : "█", win ? (lit[x + y * cols] ? "c" : "8") : KEYS[8 + shade]);
    }
    // pavement, road, markings
    for (let x = 0; x < cols; x++) {
      for (let y = 17; y <= 18; y++) g.set(x, y, y === 18 ? "▄" : "▓", y === 18 ? "f" : "A");
      for (let y = 19; y <= 29; y++) g.set(x, y, "▓", (x * 3 + y * 5) % 11 === 0 ? "e" : "d");
      if (Math.floor(x / 4) % 2 === 0) g.set(x, 24, "─", "h");
      for (let y = 30; y < rows; y++) g.set(x, y, y === 30 ? "▀" : "▒", y === 30 ? "f" : "A");
    }
    for (let x = 55; x <= 63; x++) if (x % 2 === 1) for (let y = 19; y <= 29; y++) if (y !== 24) g.set(x, y, "▒", "g");
    for (let y = 25; y <= 29; y++) g.set(54, y, "█", "g");
    for (let y = 19; y <= 23; y++) g.set(64, y, "█", "g");
    // cars
    for (const [L, c] of simulate(t)) {
      const front = L.dir > 0 ? Math.round(c.s - 14) : Math.round(cols + 13 - c.s);
      const spr = L.dir > 0 ? CAR : CARL, msk = L.dir > 0 ? MASK : MASKL;
      const x0 = L.dir > 0 ? front - 11 : front;
      const body = BODY[((c.id % BODY.length) + BODY.length) % BODY.length];
      const braking = c.v < 10;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
        const ch = spr[j][i];
        if (ch === " ") continue;
        const m = msk[j][i];
        let co = m === "w" ? "w" : m === "x" ? "x" : m === "h" ? "y" : body;
        if (j === 2 && ((L.dir > 0 && i === 1) || (L.dir < 0 && i === 10)) && braking) co = "z";
        g.set(x0 + i, L.y + j, ch, co);
      }
    }
    // the signal on its pole
    const light = lightAt(t);
    const px = 70;
    for (let y = 13; y <= 31; y++) g.set(px, y, "█", "p");
    g.text(px - 1, 31, "▄█▄", "p");
    for (let y = 1; y <= 13; y++) for (let x = px - 4; x <= px + 4; x++) g.set(x, y, "█", "o");
    const lamp = (y, on, cOn, cOff) => {
      g.text(px - 2, y - 1, "▄▄▄▄▄", "p");
      g.text(px - 2, y, "▐███▌", on ? cOn : cOff);
      g.text(px - 2, y + 1, " ▀▀▀ ", on ? cOn : cOff);
    };
    lamp(3, light === 0, "i", "l");
    lamp(7, light === 1, "j", "m");
    lamp(11, light === 2, "k", "n");
    return g.frame();
  };
}
