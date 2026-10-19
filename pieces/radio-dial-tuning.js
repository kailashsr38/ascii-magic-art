/* radio-dial-tuning: a wooden valve radio, its needle gliding along a glowing dial through static to lock on each station. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#1a2420", "#24322c", "#2e4038"], 3));
const WOOD = add(gradient(["#2a1206", "#4a220e", "#6e3618", "#94502a", "#b86e3a", "#d8904e"], 6));
const CLOTH = add(gradient(["#3a2a18", "#5a4428", "#7a5e3a", "#9a7a4e"], 4));
const DIAL = add(gradient(["#5a3a10", "#a8701e", "#e8b04a", "#ffe0a0"], 4));
const INK = add(["#2a1606", "#5a3010", "#e8341e", "#ff6a3a"]);
const UI = add(["#f2e6c8", "#7aff8a", "#1a3a1e", "#c8ccd4", "#6a707e", "#3a2a1a"]);

export const meta = {
  slug: "radio-dial-tuning",
  name: "Radio Dial Tuning",
  category: "music",
  note: "A wooden valve radio tunes across the band, the red needle gliding over a glowing amber dial through crackling static until it locks onto the next station.",
  tags: ["radio", "vintage", "tuning", "static", "retro", "hero"],
  cols: 100, rows: 32, fps: 30,
  palette: palette(P),
};

const ST = [[89.3, "NEWS"], [94.1, "JAZZ"], [98.7, "CLASSICAL"], [101.9, "LATIN"], [106.5, "TALK"]];
const DX0 = 52, DX1 = 89, F0 = 87.5, F1 = 108.5;
const fx = (f) => DX0 + ((f - F0) / (F1 - F0)) * (DX1 - DX0);

function tuning(t) {
  const seg = 5, n = Math.floor(t / seg), f = (t % seg) / seg;
  const order = [0, 1, 2, 3, 4, 3, 2, 1];
  const a = ST[order[n % 8]][0], b = ST[order[(n + 1) % 8]][0];
  if (f < 0.5) return { freq: a, lock: 1 };
  const u = (f - 0.5) / 0.5;
  const e = smooth(u) + Math.sin(u * Math.PI * 3) * 0.04 * (1 - u);
  const freq = a + (b - a) * e;
  return { freq, lock: u > 0.92 ? (u - 0.92) / 0.08 : 0 };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(4);
  const noiseTab = Array.from({ length: 997 }, () => R());
  const base = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let ch, co;
    const inCab = x >= 6 && x <= 93 && y >= 3 && y <= 28 && !(y < 6 && (Math.min(x - 6, 93 - x) < 6 - y + 3));
    if (y >= 29) { ch = "▓"; co = KEYS[WOOD + (y === 29 ? 4 : 2)]; }
    else if (inCab) {
      const v = clamp(0.5 + (fbm(x * 0.03, y * 0.5, 3, 2) - 0.5) * 0.8 + Math.sin(x * 0.25 + fbm(x * 0.05, y * 0.2) * 8) * 0.08 - (x === 6 || x === 93 || y === 28 ? 0.3 : 0) + (y === 3 ? 0.2 : 0));
      ch = "█"; co = KEYS[WOOD + Math.min(5, Math.floor(v * 6))];
      if (x >= 11 && x <= 45 && y >= 7 && y <= 25) {
        const slat = (x - 11) % 7 === 0;
        ch = slat ? "█" : (x + y) % 2 ? "▓" : "▒";
        co = slat ? KEYS[WOOD + 4] : KEYS[CLOTH + Math.min(3, Math.floor((0.5 + (fbm(x * 0.2, y * 0.3, 2, 6) - 0.5)) * 4))];
      }
    } else {
      const pat = (Math.floor(x / 4) + Math.floor(y / 2)) % 2 === 0 && x % 4 === 1 && y % 2 === 0;
      ch = pat ? "◆" : "▒"; co = KEYS[WALL + (pat ? 2 : (x + y) % 2)];
    }
    base.push([ch, co]);
  }
  return (t) => {
    for (let i = 0; i < base.length; i++) { g.ch[i] = base[i][0]; g.co[i] = base[i][1]; }
    const { freq } = tuning(t);
    const near = ST.reduce((m, s) => Math.min(m, Math.abs(s[0] - freq)), 99);
    const sig = clamp(1 - near / 1.4);
    // dial window
    for (let y = 6; y <= 15; y++) for (let x = DX0 - 2; x <= DX1 + 2; x++) {
      const edge = y === 6 || y === 15 || x === DX0 - 2 || x === DX1 + 2;
      const v = clamp(0.75 - Math.abs(x - (DX0 + DX1) / 2) / 40 - Math.abs(y - 10.5) / 14);
      g.set(x, y, edge ? "█" : "█", edge ? KEYS[WOOD] : KEYS[DIAL + 1 + Math.min(2, Math.floor(v * 3))]);
    }
    for (let f = 88; f <= 108; f++) {
      const x = Math.round(fx(f));
      g.set(x, 8, f % 2 === 0 ? "┃" : "│", KEYS[INK + (f % 2 === 0 ? 0 : 1)]);
      if (f % 4 === 0) g.text(x - Math.floor(String(f).length / 2), 7, String(f), KEYS[INK]);
    }
    g.text(DX0 - 1, 9, "FM", KEYS[INK + 1]); g.text(DX1 - 1, 9, "MHz", KEYS[INK + 1]);
    ST.forEach(([f, name]) => { const x = Math.round(fx(f)); g.set(x, 10, "▪", KEYS[INK]); });
    g.hline(DX0, DX1, 12, "─", KEYS[INK + 1]);
    for (let k = 0; k <= 6; k++) { const x = Math.round(DX0 + (k / 6) * (DX1 - DX0)); g.set(x, 12, "┼", KEYS[INK + 1]); }
    g.text(DX0, 13, "530  700  900  1200 1600", KEYS[INK + 1]);
    g.text(DX1 - 1, 14, "kHz", KEYS[INK + 1]);
    const nx = Math.round(fx(freq));
    for (let y = 7; y <= 14; y++) g.set(nx, y, "█", KEYS[INK + 2]);
    g.set(nx, 6, "▼", KEYS[INK + 3]);
    // station tag and frequency readout
    const st = ST.find((s) => Math.abs(s[0] - freq) < 0.25);
    g.fill(50, 4, 42, 1, "█", KEYS[WOOD + 1]);
    g.text(52, 4, (freq.toFixed(1) + " MHz").padEnd(10), KEYS[DIAL + 3]);
    g.text(64, 4, (st && sig > 0.8 ? st[1] : "· · ·").padEnd(10), st && sig > 0.8 ? KEYS[UI + 1] : KEYS[UI + 4]);
    // signal meter and the static or waveform scope
    g.fill(50, 17, 22, 7, " ", KEYS[UI + 2]);
    g.box(50, 17, 22, 7, "round", KEYS[UI + 4]);
    for (let x = 51; x <= 70; x++) for (let y = 18; y <= 22; y++) {
      if (sig > 0.85) {
        const v = Math.sin(x * 0.7 - t * 9) * Math.sin(x * 0.13 + t) * 2.2;
        g.set(x, y, Math.round(20 - v) === y ? "•" : " ", KEYS[UI + 1]);
      } else {
        const k = noiseTab[(x * 31 + y * 17 + Math.floor(t * 30) * 7) % 997];
        g.set(x, y, k > 0.75 ? "▓" : k > 0.5 ? "▒" : k > 0.3 ? "░" : " ", KEYS[UI + (k > 0.6 ? 3 : 4)]);
      }
    }
    g.text(52, 24, "SIGNAL", KEYS[UI]);
    for (let i = 0; i < 10; i++) g.set(59 + i, 24, i < sig * 10 ? "■" : "□", i < sig * 10 ? KEYS[UI + 1] : KEYS[UI + 5]);
    g.set(70, 24, "●", sig > 0.85 ? KEYS[UI + 1] : KEYS[UI + 2]);
    // knobs
    const knob = (cx, cy, a, lbl) => {
      for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 4; x <= cx + 4; x++) {
        const d = Math.hypot((x - cx) / 4.4, (y - cy) / 2.4);
        if (d > 1) continue;
        const ridge = Math.cos(Math.atan2((y - cy) * 2, x - cx) * 10) > 0.5 && d > 0.7;
        g.set(x, y, ridge ? "▓" : "█", KEYS[WOOD + (d < 0.75 ? (x < cx ? 5 : 4) : 1)]);
      }
      for (let r = 0.2; r < 0.8; r += 0.15) g.set(Math.round(cx + Math.cos(a) * r * 4.4), Math.round(cy + Math.sin(a) * r * 2.4), "█", KEYS[INK]);
      g.text(cx - Math.floor(lbl.length / 2), cy + 3, lbl, KEYS[DIAL + 2]);
    };
    knob(79, 20, -Math.PI / 2 + (freq - 98) * 0.4, "TUNING");
    knob(88, 20, -2.2, "VOL");
    // pilot lamp
    g.set(48, 9, "●", KEYS[DIAL + 3]);
    return g.frame();
  };
}
