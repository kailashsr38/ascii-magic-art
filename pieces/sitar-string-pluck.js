/* sitar-string-pluck: a sitar lying across the frame, a finger stops a fret, the main string is plucked and blurs into a vibrating lens while sound rings spread from the gourd. */
import { Grid, palette, gradient, KEYS, fbm, clamp, lerp, TAU } from "../lib/kit.js";

const BG = gradient(["#0a0814", "#160c22", "#24102a", "#341626"], 6);            // 0..5
const WOOD = gradient(["#2a1206", "#4e220c", "#7a3a16", "#a85a24", "#d4843c", "#f0b06a"], 10); // 6..15
const RUG = gradient(["#1e2a5a", "#2a3e80", "#3a56a8"], 3);                       // 16..18
const NAMED = {
  ivory: "#f4ecd8", ivoryD: "#bcae90", fret: "#d8dce4", fretD: "#8a909a", str: "#ffffff", strD: "#c8b088",
  blur: "#fff0b0", ring: "#ffcf6a", ringD: "#a8783a", skin: "#a8683a", skinL: "#c8844e", sleeve: "#e8e0f0",
  sleeveD: "#a89ab8", gold: "#ffd04a", dim: "#7a6a8a", bright: "#fff6dc", peg: "#3a1a0a",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[19 + i]));

export const meta = {
  slug: "sitar-string-pluck",
  name: "Sitar String Pluck",
  category: "india",
  note: "A finger stops a fret on a sitar, the main string is plucked and blurs into a decaying vibration while sound rings spread out from the gourd.",
  tags: ["sitar", "music", "india", "strings", "classical", "hero"],
  cols: 100, rows: 30, fps: 30,
  palette: palette([...BG, ...WOOD, ...RUG, ...Object.values(NAMED)]),
};

const NUT = 9, BRIDGE = 79, SY = 12;
const FRETS = [];
for (let i = 0; i < 17; i++) FRETS.push(Math.round(NUT + 3 + (BRIDGE - NUT) * (1 - Math.pow(2, -i / 12)) * 0.95));
const NOTES = [["Sa", 0], ["Re", 2], ["Ga", 4], ["Ma", 5], ["Pa", 7], ["Dha", 9], ["Ni", 11], ["Sa'", 12]];
const ORDER = [0, 1, 2, 4, 5, 4, 2, 3, 2, 1];
const P = 1.8;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 26) { bg.push([(x + y) % 4 === 0 ? "◆" : "█", (x + y) % 4 === 0 ? K.gold : KEYS[16 + ((x >> 3) + y) % 3]]); continue; }
    const n = fbm(x * 0.05, y * 0.12, 3, 6);
    const v = clamp(0.2 + y / 40 + (n - 0.5) * 0.6);
    bg.push([n > 0.6 ? "▓" : "█", KEYS[Math.min(5, Math.floor(v * 6))]]);
  }
  const put = (x, y, ch, co) => { if (x >= 0 && y >= 0 && x < cols && y < rows) bg[x + y * cols] = [ch, co]; };
  const woodK = (l) => KEYS[6 + Math.min(9, Math.max(0, Math.floor(l * 10)))];
  // small upper gourd under the pegbox
  const gourd = (cx, cy, rx, ry) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry, r = nx * nx + ny * ny;
      if (r > 1) continue;
      const l = clamp(0.95 - Math.sqrt(r) * 0.55 - nx * 0.25 - ny * 0.2);
      put(x, y, l > 0.7 ? "█" : "▓", woodK(l));
    }
  };
  gourd(13, 20, 7, 5);
  gourd(83, 17, 16, 9);
  // tabli (sound board) and floral inlay on the big gourd
  for (let x = 70; x <= 97; x++) { put(x, 10, "▄", woodK(0.75)); put(x, 11, "█", woodK(0.85)); }
  for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; put(Math.round(83 + Math.cos(a) * 9), Math.round(19 + Math.sin(a) * 4), "◆", K.ivory); }
  put(83, 19, "●", K.ivory);
  // neck
  for (let x = 3; x <= 72; x++) {
    put(x, 10, "▄", woodK(0.7));
    for (let y = 11; y <= 14; y++) put(x, y, "█", woodK(0.8 - (y - 11) * 0.08));
    put(x, 15, x % 4 === 0 ? "◆" : "▀", x % 4 === 0 ? K.ivory : woodK(0.2));
  }
  // pegs
  for (const [x, up] of [[4, 1], [7, 0], [10, 1], [5, 0], [8, 1]]) {
    for (let k = 1; k <= 3; k++) put(x, up ? 10 - k : 15 + k, "█", K.peg);
    put(x, up ? 6 : 19, "●", K.ivoryD);
  }
  for (const fx of FRETS) for (let y = 11; y <= 14; y++) put(fx, y, "│", y === 11 ? K.fret : K.fretD);
  put(NUT, 11, "█", K.ivory); put(NUT, 12, "█", K.ivory); put(NUT, 13, "█", K.ivoryD);
  for (let x = BRIDGE - 1; x <= BRIDGE + 1; x++) { put(x, 12, "▄", K.ivory); put(x, 13, "█", K.ivory); }
  // the other strings, still
  const OTHER = [14];

  const hand = (px, py, fingerTo, side) => {
    const ex = side < 0 ? px - 10 : px + 12, ey = -1;
    for (let k = 0; k < 4; k++) g.line(px + 1 + k, py - 2, ex + k, ey, "█", k === 0 || k === 3 ? K.sleeveD : K.sleeve);
    g.text(px, py - 1, "▄████▄", K.skin);
    g.text(px, py, "██████", K.skinL);
    for (let y = py + 1; y <= fingerTo; y++) g.set(px + (side < 0 ? 4 : 1), y, "█", K.skinL);
  };

  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const n = Math.floor(t / P), a = t - n * P;
    const note = NOTES[ORDER[((n % ORDER.length) + ORDER.length) % ORDER.length]];
    const fi = note[1];
    const xf = fi === 0 ? NUT : FRETS[fi - 1] + 1;
    const env = Math.exp(-a * 1.1);
    // sound rings from the gourd, only outside the instrument
    for (let k = 0; k < 3; k++) {
      const age = a - k * 0.18;
      if (age <= 0) continue;
      const rr = 18 + age * 22;
      const fade = env * (1 - age / P);
      if (fade < 0.12) continue;
      for (let q = 0; q < 180; q++) {
        const th = (q / 180) * TAU;
        const x = Math.round(83 + Math.cos(th) * rr), y = Math.round(17 + Math.sin(th) * rr * 0.5);
        if (x < 0 || y < 0 || x >= cols || y >= 26) continue;
        const i = x + y * cols;
        if (KEYS.indexOf(g.co[i]) > 5) continue;
        g.set(x, y, fade > 0.4 ? "▓" : "▒", fade > 0.4 ? K.ring : K.ringD);
      }
    }
    for (const y of OTHER) for (let x = NUT; x <= BRIDGE; x++) if (g.ch[x + y * cols] === "█") g.set(x, y, "▓", K.strD);
    // the plucked string: a decaying lens envelope and the instantaneous position
    const L = BRIDGE - xf, w = TAU * 3.1;
    g.hline(NUT, xf, SY, "─", K.str);
    for (let x = xf; x <= BRIDGE; x++) {
      const u = (x - xf) / L;
      const A = 2.7 * env * Math.sin(Math.PI * u);
      const d = A * Math.cos(w * a) + 0.35 * env * Math.sin(TAU * u) * Math.cos(w * 2 * a);
      if (A > 0.5) for (let y = Math.ceil(SY - A); y <= Math.floor(SY + A); y++) if (y !== SY) g.set(x, y, Math.abs(y - SY) < A * 0.6 ? "▒" : "░", K.blur);
      const yy = SY + d, ry = Math.round(yy), fr = yy - ry;
      g.set(x, ry, Math.abs(fr) < 0.2 ? "─" : fr < 0 ? "▀" : "▄", K.str);
    }
    // left hand stops the fret, right hand plucks near the bridge
    hand(xf - 3, 7, SY - 1, -1);
    const pl = a < 0.12 ? lerp(SY - 1, SY + 1, a / 0.12) : lerp(SY + 1, 7, clamp((a - 0.12) / 0.5));
    hand(70, Math.round(pl) - 1, Math.round(pl), 1);
    // swara strip
    let x = 22;
    for (const [nm, f] of NOTES) {
      g.text(x, 1, nm, f === fi ? K.bright : K.dim);
      if (f === fi) g.text(x, 2, "▀".repeat(nm.length), K.gold);
      x += nm.length + 4;
    }
    return g.frame();
  };
}
