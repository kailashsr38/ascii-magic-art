/* conductor-baton-beats: a conductor seen from behind, the baton tip tracing the 4/4 and 3/4 beat patterns with a glowing trail. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const HALL = add(gradient(["#2a1410", "#42201a", "#5e2e22", "#7a3e2a", "#9a5234"], 5));
const FLOOR = add(gradient(["#1a0e06", "#3a2210", "#5a3618"], 3));
const LAMP = add(["#ffd88a", "#a07a3a", "#5a4020"]);
const COAT = add(["#0c0c12", "#22222c", "#4a4a5a", "#e8e8ec", "#c8c8d0"]);
const SKIN = add(["#c8805a", "#e6a27c"]);
const HAIR = add(["#b8b8c0", "#7a7a84"]);
const TRAIL = add(gradient(["#3a2a10", "#8a6a2a", "#e8c060", "#fff4c8"], 6));
const UI = add(["#ffffff", "#ffd84a", "#d8c8b0", "#c8a070", "#ff8a5a"]);

export const meta = {
  slug: "conductor-baton-beats",
  name: "Conductor Baton Beats",
  category: "music",
  note: "A conductor seen from behind leads an orchestra, the baton tip tracing four and three beat patterns with a golden trail and each beat number lighting up.",
  tags: ["conductor", "orchestra", "tempo", "classical", "beat pattern", "hero"],
  cols: 92, rows: 32, fps: 30,
  palette: palette(P),
};

const CX = 60, CY = 9, SX = 26, SYc = 6;
const BPM = 84;
const PAT4 = [[0, 0.85], [-0.75, 0.55], [0.85, 0.5], [0.15, 0.2]];
const PAT3 = [[0, 0.85], [0.8, 0.5], [0.2, 0.15]];

function tip(beat) {
  // 4 bars of 4/4 (16 beats), then 4 bars of 3/4 (12 beats)
  const cyc = 28, b = ((beat % cyc) + cyc) % cyc;
  const four = b < 16;
  const pat = four ? PAT4 : PAT3, n = pat.length;
  const local = four ? b : b - 16;
  const i = Math.floor(local) % n, u = local % 1;
  const a = pat[i], c = pat[(i + 1) % n];
  const e = Math.pow(u, 1.7);
  const last = i === n - 1;
  const h = last ? 1.6 : 0.55;
  const x = a[0] + (c[0] - a[0]) * e;
  const y = a[1] + (c[1] - a[1]) * e - Math.sin(Math.PI * Math.pow(u, 0.8)) * h;
  return { x, y, i, four, u };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(9);
  const stands = Array.from({ length: 26 }, (_, k) => [4 + (k % 13) * 7 + R() * 2, k < 13 ? 17 : 20]);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let v, co, ch;
    if (y >= 17) { v = clamp(0.3 + (y - 17) * 0.05 + (fbm(x * 0.2, y * 0.8, 2) - 0.5) * 0.3); co = KEYS[FLOOR + Math.min(2, Math.floor(v * 3))]; ch = "▓"; }
    else {
      v = clamp(0.25 + (fbm(x * 0.05, y * 0.15, 3, 3) - 0.5) * 0.4 + (y > 9 ? 0.15 : 0) + Math.exp(-Math.hypot((x - CX) / 30, (y - 12) / 8)) * 0.3);
      co = KEYS[HALL + Math.min(4, Math.floor(v * 5))]; ch = x % 9 === 0 && y < 9 ? "│" : "▒";
    }
    bg.push([ch, co]);
  }
  const P2 = (p) => [CX + p[0] * SX, CY + p[1] * SYc];
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const beat = (t * BPM) / 60;
    // orchestra: stand lamps and players bobbing gently
    stands.forEach(([x, y], k) => {
      const bob = Math.sin(beat * Math.PI + k) > 0.7 ? 1 : 0;
      g.text(Math.round(x), y - 2 - bob, "▄█▄", KEYS[COAT + 1]);
      g.text(Math.round(x), y - 1, "███", KEYS[COAT + 1]);
      g.text(Math.round(x) + 3, y - 1, "▄▄", KEYS[LAMP]);
      g.set(Math.round(x) + 4, y, "│", KEYS[LAMP + 2]);
    });
    // beat pattern guide
    const cur = tip(beat);
    const pat = cur.four ? PAT4 : PAT3;
    for (let s = 0; s < 1; s += 0.004) {
      const p = tip((cur.four ? 0 : 16) + s * pat.length);
      const [x, y] = P2([p.x, p.y]);
      if (g.get(x, y) !== "●") g.set(x, y, "•", KEYS[UI + 3]);
    }
    pat.forEach((p, k) => {
      const [x, y] = P2(p);
      const hit = k === cur.i && cur.u < 0.3;
      g.set(x, y, "●", hit ? KEYS[UI] : KEYS[UI + 2]);
      g.text(x + (k === 1 && cur.four ? -3 : 2), y, String(k + 1), hit ? KEYS[UI + 1] : KEYS[UI + 2]);
    });
    // trail
    for (let k = 24; k >= 0; k--) {
      const p = tip(beat - k * 0.02);
      const [x, y] = P2([p.x, p.y]);
      const f = 1 - k / 24;
      const c = KEYS[TRAIL + Math.min(5, Math.floor(f * 6))];
      g.set(x, y, f > 0.85 ? "█" : f > 0.5 ? "▓" : "▒", c); g.set(x + 1, y, f > 0.5 ? "█" : "▒", c);
    }
    const [tx, ty] = P2([cur.x, cur.y]);
    // conductor from behind
    const shX = 56, shY = 23;
    const hx = shX + (tx - shX) * 0.5, hy = shY + (ty - shY) * 0.55;
    const lx = 26 + Math.sin(beat * Math.PI * 0.25) * 3, ly = 15 + Math.cos(beat * Math.PI * 0.25) * 2;
    for (let w = -1; w <= 1; w++) for (const d of [0, 1]) g.line(36 + w, 23 + d, lx + w, ly + d, "█", KEYS[COAT + (d === 0 && w <= 0 ? 2 : 1)]);
    g.text(Math.round(lx) - 1, Math.round(ly) - 1, "▄█▄", KEYS[SKIN + 1]);
    for (let y = 22; y < rows; y++) {
      const w = 10 + Math.min(6, (y - 22) * 1.5);
      for (let x = Math.round(46 - w); x <= Math.round(46 + w); x++) {
        const edge = Math.abs(x - 46) > w - 1.5;
        g.set(x, y, "█", KEYS[COAT + (edge ? 2 : y === 22 ? 1 : 0)]);
      }
    }
    g.vline(46, 25, rows - 1, "│", KEYS[COAT + 1]);
    g.text(43, 22, "▀███▀", KEYS[COAT + 3]);
    for (let y = 15; y <= 22; y++) for (let x = 40; x <= 52; x++) {
      const d = Math.hypot((x - 46) / 5.2, (y - 18.5) / 3.4);
      if (d > 1) continue;
      g.set(x, y, (x + y) % 2 ? "▓" : "█", y > 20 ? KEYS[SKIN] : KEYS[HAIR + (d > 0.7 ? 1 : 0)]);
    }
    g.set(40, 19, "▐", KEYS[SKIN]); g.set(52, 19, "▌", KEYS[SKIN]);
    for (let w = -1; w <= 1; w++) for (const d of [0, 1]) g.line(shX + w, shY + d, hx + w, hy + d, "█", KEYS[COAT + (d === 0 && w >= 0 ? 2 : 1)]);
    g.text(Math.round(hx) - 1, Math.round(hy), "▄█▄", KEYS[SKIN + 1]);
    g.line(hx, hy, tx, ty, "▪", KEYS[COAT + 3]);
    g.set(tx, ty, "●", KEYS[UI]);
    // tag
    g.fill(1, 0, 24, 3, " ", KEYS[UI]);
    g.text(2, 1, cur.four ? "4/4  COMMON TIME" : "3/4  WALTZ      ", KEYS[UI + 1]);
    g.text(cols - 13, 1, `TEMPO ${BPM}`, KEYS[UI + 2]);
    g.text(cols - 26, 1, `BEAT ${cur.i + 1}`, cur.u < 0.3 ? KEYS[UI] : KEYS[UI + 2]);
    return g.frame();
  };
}
