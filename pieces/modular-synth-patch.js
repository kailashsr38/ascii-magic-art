/* modular-synth-patch: a two row modular synth rack, patch cables swaying between jacks while LEDs step and blink. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const RACK = add(gradient(["#08090c", "#14161b", "#20232a"], 3));
const PAN = add(["#2a2d34", "#d8d0bc", "#14151a", "#3a4a5a", "#5a3a2a", "#c8ccd4"]);
const INK = add(["#e6edf3", "#2a2620", "#8b949e", "#f2e6c8"]);
const MET = add(["#7a808c", "#c8ccd4", "#3a3e48", "#e8eef4"]);
const CAB = add(["#ff4a5a", "#ffb02a", "#3ad0ff", "#7aff5a", "#d25aff", "#ffe84a"]);
const CABD = add(["#8a1a2a", "#8a5a10", "#1a6a8a", "#3a8a2a", "#6a2a8a", "#8a7a1a"]);
const LED = add(["#ff3a3a", "#5a1414", "#3aff6a", "#145a24", "#ffd84a", "#5a4a14"]);

export const meta = {
  slug: "modular-synth-patch",
  name: "Modular Synth Patch",
  category: "music",
  note: "A two row modular synth rack with coloured patch cables swaying between jacks, a step sequencer walking its LEDs and one cable being re-patched every few seconds.",
  tags: ["synth", "modular", "patch", "electronic", "hero", "wallpaper"],
  cols: 110, rows: 34, fps: 30,
  palette: palette(P),
};

// [title, width, panel colour, knob rows, jack count]
const ROW1 = [["CLOCK", 9, 2], ["SEQ 8", 18, 0], ["VCO 1", 11, 1], ["VCO 2", 11, 1], ["NOISE", 8, 4], ["MIXER", 11, 0], ["VCF", 11, 3], ["ENV", 10, 2], ["LFO", 9, 4]];
const ROW2 = [["VCA", 10, 0], ["S+H", 9, 2], ["DELAY", 14, 3], ["SPRING", 12, 4], ["MULT", 7, 2], ["QUANT", 10, 1], ["SCOPE", 18, 2], ["OUTPUT", 14, 0]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const mods = [];
  const jacks = [];
  const place = (list, y0) => {
    let x = 2;
    for (const [name, w, pc] of list) {
      const m = { name, x, y: y0, w, h: 14, pc, jacks: [] };
      // jacks along the lower part
      const per = Math.max(1, Math.floor((w - 2) / 3));
      for (let r = 0; r < 2; r++) for (let j = 0; j < per; j++) {
        const jx = x + 1 + j * 3 + 1, jy = y0 + 10 + r * 2;
        m.jacks.push(jacks.length); jacks.push([jx, jy]);
      }
      mods.push(m); x += w + 1;
    }
  };
  place(ROW1, 1); place(ROW2, 18);
  const J = (mi, k) => mods[mi].jacks[k % mods[mi].jacks.length];
  // cables: [jackA, jackB, colour, sag]
  const CABLES = [
    [J(0, 0), J(1, 2), 0, 4], [J(1, 6), J(2, 1), 1, 5], [J(2, 4), J(5, 0), 2, 6], [J(3, 3), J(5, 1), 3, 5],
    [J(5, 5), J(6, 0), 4, 4], [J(6, 4), J(9, 1), 5, 9], [J(7, 2), J(9, 0), 0, 8], 
    [J(9, 3), J(16, 0), 3, 7], [J(14, 1), J(15, 6), 4, 5],
  ];
  const REPATCH = [J(12, 0), J(12, 4), J(13, 1), J(11, 5)];
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bg.push(KEYS[RACK + Math.min(2, Math.floor(clamp(0.3 + (fbm(x * 0.1, y * 0.2, 2) - 0.5) * 0.6) * 3))]);
  const panelTex = mods.map((m) => {
    const a = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) a.push("█");
    return a;
  });
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = "░"; g.co[i] = bg[i]; }
    // rails
    for (const ry of [0, 15, 17, 32]) for (let x = 0; x < cols; x++) g.set(x, ry, x % 6 === 3 ? "○" : "▀", x % 6 === 3 ? KEYS[MET + 2] : KEYS[MET]);
    const step = Math.floor(t * 4) % 8, clk = (t * 4) % 1 < 0.3;
    const lfo = (Math.sin(t * TAU * 0.6) + 1) / 2;
    mods.forEach((m, mi) => {
      const light = m.pc === 1;
      const pc = KEYS[PAN + m.pc], ink = light ? KEYS[INK + 1] : KEYS[INK];
      const tex = panelTex[mi];
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) g.set(m.x + x, m.y + y, tex[y * m.w + x], pc);
      g.set(m.x, m.y, "▪", KEYS[MET + 1]); g.set(m.x + m.w - 1, m.y + m.h - 1, "▪", KEYS[MET + 1]);
      g.text(m.x + Math.floor((m.w - m.name.length) / 2), m.y + 1, m.name, ink);
      // knobs
      const nk = Math.max(1, Math.floor((m.w - 1) / 4));
      for (let r = 0; r < 2; r++) for (let k = 0; k < nk; k++) {
        const kx = m.x + 1 + k * 4, ky = m.y + 3 + r * 3;
        if (m.name === "SEQ 8" && r === 0) continue;
        const ang = ((mi * 0.37 + k * 0.21 + r * 0.5) % 1) + (m.name === "VCF" && r === 0 && k === 0 ? 0.2 * Math.sin(t * 0.7) : 0);
        g.text(kx, ky, "(" + ["\\", "|", "/", "-"][Math.floor(((ang % 1) + 1) % 1 * 4)] + ")", light ? KEYS[INK + 1] : KEYS[MET + 1]);
      }
      if (m.name === "SEQ 8") for (let s = 0; s < 8; s++) {
        g.set(m.x + 2 + s * 2, m.y + 3, "●", s === step ? KEYS[LED] : KEYS[LED + 1]);
        const h = [3, 5, 2, 6, 4, 1, 5, 3][s];
        for (let q = 0; q < 6; q++) g.set(m.x + 2 + s * 2, m.y + 9 - q, q < h ? "▄" : "·", q < h ? (s === step ? KEYS[LED + 4] : KEYS[MET + 1]) : KEYS[MET + 2]);
      }
      if (m.name === "CLOCK") { g.set(m.x + m.w - 2, m.y + 1, "●", clk ? KEYS[LED + 2] : KEYS[LED + 3]); g.text(m.x + 1, m.y + 8, "120BPM", KEYS[LED + 4]); }
      if (m.name === "LFO") g.set(m.x + m.w - 2, m.y + 8, "●", lfo > 0.5 ? KEYS[LED] : KEYS[LED + 1]);
      if (m.name === "ENV") { const e = Math.exp(-((t * 4) % 1) * 4); g.set(m.x + m.w - 2, m.y + 8, "●", e > 0.4 ? KEYS[LED + 4] : KEYS[LED + 5]); }
      if (m.name === "S+H") g.set(m.x + m.w - 2, m.y + 8, "●", clk ? KEYS[LED + 2] : KEYS[LED + 3]);
      if (m.name === "SCOPE") {
        for (let x = 1; x < m.w - 1; x++) for (let y = 3; y < 9; y++) g.set(m.x + x, m.y + y, " ", KEYS[PAN + 2]);
        for (let x = 1; x < m.w - 1; x++) {
          const v = Math.sin(x * 0.7 - t * 6) * (0.6 + 0.4 * lfo);
          g.set(m.x + x, m.y + 6 - Math.round(v * 2.4), "•", KEYS[LED + 2]);
        }
      }
      if (m.name === "OUTPUT") for (let s = 0; s < 8; s++) {
        const lv = Math.exp(-((t * 2) % 1) * 3) * 8;
        g.set(m.x + 3 + s, m.y + 8, "■", s < lv ? KEYS[s > 6 ? LED : s > 4 ? LED + 4 : LED + 2] : KEYS[MET + 2]);
      }
    });
    // jacks
    for (const [jx, jy] of jacks) { g.set(jx, jy, "○", KEYS[MET + 1]); }
    // the re-patched cable
    const per = 7, cyc = Math.floor(t / per), f = (t % per) / per;
    const from = REPATCH[cyc % REPATCH.length], to = REPATCH[(cyc + 1) % REPATCH.length];
    const mv = smooth(clamp((f - 0.7) / 0.25));
    const all = CABLES.map((c) => [jacks[c[0]], jacks[c[1]], c[2], c[3]]);
    const A = jacks[from], B = jacks[to];
    const end = [A[0] + (B[0] - A[0]) * mv, A[1] + (B[1] - A[1]) * mv - Math.sin(mv * Math.PI) * 8];
    all.push([jacks[J(4, 0)], end, 3, 7, true]);
    all.forEach(([a, b, c, sag, live], ci) => {
      const sw = Math.sin(t * 0.9 + ci * 1.7) * 1.6;
      const mx = (a[0] + b[0]) / 2 + sw, my = Math.max(a[1], b[1]) + sag + Math.cos(t * 0.9 + ci) * 0.6;
      const n = Math.ceil(Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) + sag * 2) * 2;
      for (let i = 0; i <= n; i++) {
        const u = i / n, iu = 1 - u;
        const x = iu * iu * a[0] + 2 * iu * u * mx + u * u * b[0];
        const y = iu * iu * a[1] + 2 * iu * u * my + u * u * b[1];
        const yy = Math.min(rows - 1, y);
        g.set(x, yy, "█", (Math.floor(x) + Math.floor(yy)) % 3 === 0 ? KEYS[CABD + c] : KEYS[CAB + c]);
      }
      g.set(a[0], a[1], "●", KEYS[CAB + c]);
      if (!live || mv >= 1 || mv <= 0) g.set(b[0], b[1], "●", KEYS[CAB + c]);
      else { g.set(b[0], b[1], "▼", KEYS[INK]); }
    });
    return g.frame();
  };
}
