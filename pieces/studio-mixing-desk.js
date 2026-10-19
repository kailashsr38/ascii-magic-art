/* studio-mixing-desk: a recording console with twelve channel strips, faders riding automation and VU meters dancing. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const DESK = add(gradient(["#121419", "#1c2028", "#272c36", "#343a46"], 5));
const LED = add(gradient(["#22d36a", "#9ae63a", "#f0d43a", "#ff8a30", "#ff3a3a"], 12));
const LEDD = add(["#0e2416", "#2a2a10", "#3a1414"]);
const UI = add(["#e6edf3", "#8b949e", "#484f58", "#c8ccd4", "#6a707e", "#ffffff"]);
const CAP = add(["#ff7b72", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#f2cc60"]);
const VU = add(["#f4dfa8", "#e8c87a", "#2a1a10", "#d8342e", "#5a4020"]);

export const meta = {
  slug: "studio-mixing-desk",
  name: "Studio Mixing Desk",
  category: "music",
  note: "A studio mixing console with twelve channel strips, faders gliding on automation, LED meters bouncing and two needle VU meters on the master bus.",
  tags: ["mixer", "studio", "recording", "audio", "faders", "hero"],
  cols: 108, rows: 36, fps: 30,
  palette: palette(P),
};

const CH = ["KICK", "SNARE", "HATS", "TOMS", "OHEAD", "BASS", "GTR L", "GTR R", "KEYS", "PAD", "VOX", "BVOX"];
const SW = 7, SX = 2, FY0 = 13, FY1 = 31;

function env(i, t) {
  const b = t * 2, ph = b % 1, bar = Math.floor(b);
  const e = [
    Math.exp(-ph * 6), bar % 2 ? Math.exp(-ph * 7) : 0.1, Math.exp(-((b * 2) % 1) * 8), bar % 4 === 3 ? Math.exp(-((b * 4) % 1) * 4) : 0.05,
    0.4 + 0.4 * Math.exp(-((b * 2) % 1) * 4), 0.6 + 0.3 * Math.exp(-ph * 3), 0.55 + 0.3 * noise2(t * 2, 1), 0.55 + 0.3 * noise2(t * 2, 9),
    0.5 + 0.3 * Math.sin(t * 1.3), 0.65 + 0.15 * Math.sin(t * 0.5), 0.45 + 0.5 * noise2(t * 3.1, 4), 0.3 + 0.4 * noise2(t * 2.3, 6),
  ][i];
  return clamp(e + (noise2(t * 5, i * 3) - 0.5) * 0.2);
}
const fader = (i, t) => clamp(0.55 + 0.25 * Math.sin(t * (0.35 + i * 0.07) + i * 1.9) + (i === 10 ? 0.15 * Math.sin(t * 1.1) : 0), 0.08, 0.95);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(0.45 + (fbm(x * 0.05, y * 0.5, 2, 5) - 0.5) * 0.4 - y * 0.006);
    bg.push(KEYS[DESK + Math.min(3, Math.floor(v * 4))]);
  }
  const knob = (x, y, a, co) => {
    const p = ["\\", "|", "/", "-"][Math.floor(((a % 1) + 1) % 1 * 4)];
    g.set(x, y, "(", KEYS[UI + 4]); g.set(x + 1, y, p, co); g.set(x + 2, y, ")", KEYS[UI + 4]);
  };
  const meterV = (x, y0, y1, v) => {
    const n = y1 - y0 + 1;
    for (let s = 0; s < n; s++) {
      const on = s < Math.round(v * n), li = Math.floor((s / n) * 12);
      g.set(x, y1 - s, "▄", on ? KEYS[LED + li] : KEYS[LEDD + (li > 9 ? 2 : li > 6 ? 1 : 0)]);
    }
  };
  const needle = (x0, y0, w, h, v, lbl) => {
    g.fill(x0, y0, w, h, "█", KEYS[VU]);
    const px = x0 + (w - 1) / 2, py = y0 + h - 1;
    const R = (w - 3) / 2;
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI + 0.35 + (i / 20) * (Math.PI - 0.7);
      g.set(Math.round(px + Math.cos(a) * R), Math.round(py + Math.sin(a) * R * 0.75), i > 14 ? "▄" : "▄", i > 14 ? KEYS[VU + 3] : KEYS[VU + 2]);
    }
    const a = Math.PI + 0.35 + clamp(v) * (Math.PI - 0.7);
    for (let r = 0; r < R * 0.95; r += 0.3) {
      const x = px + Math.cos(a) * r, y = py + Math.sin(a) * r * 0.75;
      const c = Math.abs(Math.cos(a)) < 0.38 ? "|" : Math.cos(a) < 0 ? "\\" : "/";
      g.set(Math.round(x), Math.round(y), r < 1 ? c : "█", KEYS[VU + 2]);
    }
    g.set(Math.round(px), py, "▄", KEYS[VU + 2]);
    g.text(x0 + 1, y0 + h - 1, lbl, KEYS[VU + 4]);
    g.text(x0 + w - 3, y0 + h - 1, "VU", KEYS[VU + 4]);
  };
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = "▒"; g.co[i] = bg[i]; }
    g.fill(0, 0, cols, 1, "▀", KEYS[UI + 2]);
    g.text(2, 0, " SESSION 14  ·  TAKE 3  ·  48k  ·  AUTO READ ", KEYS[UI + 1]);
    const tc = Math.floor(t * 30), ss = Math.floor(t) % 60, mm = Math.floor(t / 60) % 60;
    g.text(cols - 20, 0, ` 00:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(tc % 30).padStart(2, "0")} `, KEYS[CAP + 3]);
    for (let i = 0; i < CH.length; i++) {
      const x = SX + i * SW, e = env(i, t), f = fader(i, t);
      g.vline(x + SW - 1, 1, rows - 2, "│", KEYS[DESK + 4]);
      g.text(x + 1, 1, String(i + 1).padStart(2, "0"), KEYS[UI + 1]);
      g.set(x + 4, 1, "●", e > 0.85 ? KEYS[LED + 11] : KEYS[LEDD]);
      knob(x + 3, 2, 0.1 + i * 0.07, KEYS[UI]); g.text(x, 2, "GN", KEYS[UI + 2]);
      knob(x + 3, 4, 0.2 + 0.03 * i, KEYS[CAP]); g.text(x, 4, "HI", KEYS[UI + 2]);
      knob(x + 3, 5, 0.6 - 0.04 * i, KEYS[CAP + 2]); g.text(x, 5, "MD", KEYS[UI + 2]);
      knob(x + 3, 6, 0.35 + 0.05 * i, KEYS[CAP + 1]); g.text(x, 6, "LO", KEYS[UI + 2]);
      knob(x + 3, 8, 0.25 + 0.04 * Math.sin(i), KEYS[CAP + 4]); g.text(x, 8, "AX", KEYS[UI + 2]);
      knob(x + 3, 9, i % 2 ? 0.1 : 0.4, KEYS[UI + 3]); g.text(x, 9, "PN", KEYS[UI + 2]);
      const mute = (i === 9 && Math.floor(t / 6) % 2 === 1), solo = (i === 10 && t % 12 > 9);
      g.set(x + 1, 11, "M", mute ? KEYS[UI + 5] : KEYS[UI + 2]); g.set(x + 4, 11, "S", solo ? KEYS[CAP + 5] : KEYS[UI + 2]);
      if (mute) g.set(x + 2, 11, "■", KEYS[CAP]); if (solo) g.set(x + 3, 11, "■", KEYS[CAP + 5]);
      // fader slot and cap
      g.vline(x + 2, FY0, FY1, "│", KEYS[UI + 2]);
      for (let y = FY0; y <= FY1; y += 3) g.set(x + 1, y, "-", KEYS[UI + 4]);
      const fy = Math.round(FY1 - f * (FY1 - FY0));
      g.text(x + 1, fy - 1, "▄▄▄", KEYS[UI + 3]); g.text(x + 1, fy, "███", KEYS[CAP + (i % 6)]); g.text(x + 1, fy + 1, "▀▀▀", KEYS[UI + 4]);
      meterV(x + 4, FY0, FY1, mute ? 0 : e * (0.4 + f * 0.7));
      g.text(x, rows - 2, CH[i].slice(0, 5).padEnd(5), KEYS[CAP + (i % 6)]);
    }
    // master section
    const mx = SX + CH.length * SW + 1, mw = cols - mx - 2;
    g.fill(mx, 1, mw, rows - 2, "▓", KEYS[DESK + 2]);
    g.text(mx + 1, 1, "MASTER BUS", KEYS[UI]);
    const lr = (tt) => {
      let l = 0, r = 0;
      for (let i = 0; i < CH.length; i++) { const v = env(i, tt) * fader(i, tt); l += v * (i % 2 ? 0.7 : 1); r += v * (i % 2 ? 1 : 0.7); }
      return [clamp(l / 7.5), clamp(r / 7.5)];
    };
    let L = 0, R = 0;
    for (let k = 0; k < 6; k++) { const [l, r] = lr(t - k * 0.06); L += l / 6; R += r / 6; }
    const sm = (v) => v; // needles read the same drive
    needle(mx + 1, 3, mw - 2, 6, sm(L), "L");
    needle(mx + 1, 10, mw - 2, 6, sm(R), "R");
    const f = 0.7 + 0.05 * Math.sin(t * 0.2);
    const fx = mx + 3;
    g.vline(fx + 1, 18, 31, "│", KEYS[UI + 2]);
    const fy = Math.round(31 - f * 13);
    g.text(fx, fy - 1, "▄▄▄", KEYS[UI + 3]); g.text(fx, fy, "███", KEYS[UI + 5]); g.text(fx, fy + 1, "▀▀▀", KEYS[UI + 4]);
    meterV(fx + 5, 18, 31, L); meterV(fx + 7, 18, 31, R);
    g.text(fx + 10, 19, "0 dB", KEYS[UI + 1]); g.text(fx + 10, 25, "-12", KEYS[UI + 1]); g.text(fx + 10, 30, "-40", KEYS[UI + 1]);
    g.text(mx + 1, rows - 2, "MAIN L/R", KEYS[UI]);
    return g.frame();
  };
}
