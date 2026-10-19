/* guitar-fretting-hand: an acoustic guitar neck, a hand fretting chord shapes while the strummed strings vibrate. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#06070a", "#0e1016", "#181a24", "#22242e"], 4));
const ROSE = add(gradient(["#1a0c08", "#2a140c", "#3a1e12", "#4a2818"], 4));
const SPRUCE = add(gradient(["#8a5a2a", "#b8823e", "#d8a456", "#ecc47a"], 5));
const MET = add(["#5a5e68", "#a8b0bc", "#e8eef4", "#c89a5a", "#e8c07a", "#7a5a2a"]);
const SKIN = add(gradient(["#6a3a26", "#a05c3c", "#c8805a", "#e6a27c", "#f6c4a0"], 5));
const UI = add(["#f2e6c8", "#3a2010", "#0a0604", "#ffd84a", "#e6edf3", "#8b949e"]);

export const meta = {
  slug: "guitar-fretting-hand",
  name: "Guitar Fretting Hand",
  category: "music",
  note: "A hand moves between chord shapes on an acoustic guitar neck while a pick strums and the strings blur as they vibrate.",
  tags: ["guitar", "chords", "strings", "acoustic", "hero", "wallpaper"],
  cols: 108, rows: 30, fps: 30,
  palette: palette(P),
};

const NUT = 10, LSC = 96, BRIDGE = 104, SY = [9, 11, 13, 15, 17, 19];
const fx = (n) => NUT + LSC * (1 - Math.pow(2, -n / 12));
// fingers: [fret, string] for index, middle, ring (null = not used)
const CHORDS = [
  { name: "C", f: [[1, 4], [2, 2], [3, 1]], mute: [0] },
  { name: "Am", f: [[1, 4], [2, 2], [2, 3]], mute: [0] },
  { name: "D", f: [[2, 3], [2, 5], [3, 4]], mute: [0, 1] },
  { name: "G", f: [[2, 1], [3, 0], [3, 5]], mute: [] },
];
const PAT = [0, 1, 1.5, 2.5, 3, 3.5]; // strum beats in a bar
const BPM = 96;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bodyL = (y) => 64 + 7 * ((y - 14) / 14) ** 2 + (Math.abs(y - 14) > 9 ? 2 : 0);
  const base = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let ch = "▒", co;
    if (x >= bodyL(y) && y >= 0 && y < rows) {
      const grain = fbm(x * 0.02, y * 0.9, 2, 8);
      const v = clamp(0.45 + (grain - 0.5) * 0.8 - (x - bodyL(y) < 1.5 ? 0.4 : 0) - Math.abs(y - 14) * 0.015);
      const hole = Math.hypot((x - 84) / 9, (y - 14) / 4.6);
      if (hole < 1) { ch = "█"; co = KEYS[UI + 2]; }
      else if (hole < 1.3) { ch = hole < 1.12 ? "▓" : "█"; co = hole < 1.12 ? KEYS[UI + 1] : KEYS[MET + 5]; }
      else { ch = v > 0.55 ? "█" : "▓"; co = KEYS[SPRUCE + Math.min(4, Math.floor(v * 5))]; }
      if (x >= BRIDGE - 1 && x <= BRIDGE + 1 && y >= 7 && y <= 21) { ch = "█"; co = KEYS[ROSE]; }
    } else if (y >= 7 && y <= 21 && x >= NUT - 1) {
      const v = clamp(0.4 + (fbm(x * 0.05, y * 0.7, 2, 5) - 0.5) * 0.7);
      ch = y === 7 || y === 21 ? "█" : "▓";
      co = y === 7 || y === 21 ? KEYS[UI] : KEYS[ROSE + Math.min(3, Math.floor(v * 4))];
    } else if (x < NUT - 1 && y >= 5 && y <= 23) {
      ch = "█"; co = KEYS[ROSE + 1 + ((x + y) % 2)];
      if (x > 1 && x < NUT - 2 && (y === 6 || y === 22)) { ch = "●"; co = KEYS[MET + 1]; }
    } else {
      const v = clamp(0.35 + (fbm(x * 0.06, y * 0.12, 3) - 0.5) * 0.6);
      co = KEYS[BG + Math.min(3, Math.floor(v * 4))];
      ch = v > 0.45 ? "▒" : "░";
    }
    base.push([ch, co]);
  }
  return (t) => {
    for (let i = 0; i < base.length; i++) { g.ch[i] = base[i][0]; g.co[i] = base[i][1]; }
    // frets and inlays
    for (let n = 1; n <= 13; n++) {
      const x = Math.round(fx(n));
      if (x >= bodyL(14)) break;
      g.vline(x, 8, 20, "│", KEYS[MET + 1]);
      if ([3, 5, 7, 9].includes(n)) g.set((fx(n) + fx(n - 1)) / 2, 14, "●", KEYS[UI]);
      if (n === 12) { g.set((fx(12) + fx(11)) / 2, 12, "●", KEYS[UI]); g.set((fx(12) + fx(11)) / 2, 16, "●", KEYS[UI]); }
    }
    g.vline(NUT - 1, 7, 21, "█", KEYS[UI]);
    const beat = (t * BPM) / 60, bar = Math.floor(beat / 4), inBar = beat - bar * 4;
    const ci = bar % CHORDS.length, prev = CHORDS[(ci + CHORDS.length - 1) % CHORDS.length], ch = CHORDS[ci];
    const k = smooth(clamp(inBar / 0.5));
    // last strum
    let last = -1;
    for (let i = 0; i < PAT.length; i++) if (PAT[i] <= inBar) last = i;
    const sAge = last < 0 ? 10 : ((inBar - PAT[last]) * 60) / BPM;
    const up = last >= 0 && PAT[last] % 1 !== 0;
    const fretOf = (s) => { let f = 0; for (const [fr, st] of ch.f) if (st === s) f = Math.max(f, fr); return f; };
    // strings
    for (let s = 0; s < 6; s++) {
      const y = SY[s], thick = s < 3;
      const muted = ch.mute.includes(s);
      const xa = fx(fretOf(s)), order = up ? 5 - s : s;
      const age = sAge - order * 0.012;
      const amp = age < 0 ? 0 : (muted ? 0.15 : 1) * Math.exp(-age * 2.2);
      for (let x = NUT; x <= BRIDGE - 2; x++) {
        let c = thick ? "━" : "─", co = thick ? KEYS[MET + 4] : KEYS[MET + 1];
        if (x > xa && amp > 0.05) {
          const env = Math.sin((Math.PI * (x - xa)) / (BRIDGE - xa));
          const d = amp * env * Math.cos(t * (60 + s * 17) + x * 0.02);
          if (d > 0.3) c = "▔"; else if (d < -0.3) c = "▁";
          if (amp * env > 0.45) { g.set(x, y - 1, "░", thick ? KEYS[MET + 5] : KEYS[MET]); g.set(x, y + 1, "░", thick ? KEYS[MET + 5] : KEYS[MET]); }
          co = thick ? KEYS[MET + 4] : KEYS[MET + 2];
        }
        g.set(x, y, c, co);
      }
      if (muted) g.set(NUT - 3, y, "×", KEYS[UI + 3]);
    }
    // fretting hand: palm below the neck, fingers reaching up to the strings
    const pos = (fr, st) => [Math.round((fx(fr) * 3 + fx(fr - 1)) / 4) - 1, SY[st]];
    const fingers = [0, 1, 2].map((i) => {
      const a = pos(...prev.f[i]), b = pos(...ch.f[i]);
      const lift = Math.sin(k * Math.PI) * 2;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + lift];
    });
    for (let i = 1; i < 3; i++) if (fingers[i][0] < fingers[i - 1][0] + 3) fingers[i][0] = fingers[i - 1][0] + 3;
    const pinky = [fingers[2][0] + 4, 22];
    fingers.push(pinky);
    const hx = (fingers[0][0] + fingers[2][0]) / 2;
    for (let y = 23; y < rows; y++) for (let x = Math.round(hx - 9); x <= Math.round(hx + 9); x++) {
      const dx = (x - hx) / (9 - (y - 23) * 0.3), dy = (y - 23) / 7;
      if (dx * dx + dy * dy * 0.3 > 1) continue;
      const v = clamp(0.7 - Math.abs(dx) * 0.4 - dy * 0.4);
      g.set(x, y, "█", KEYS[SKIN + Math.min(4, Math.floor(v * 5))]);
    }
    fingers.forEach(([fxp, fy], i) => {
      const x0 = Math.round(fxp), top = Math.round(fy);
      for (let y = top; y <= 24; y++) {
        const shade = y === top ? 4 : (y - top) % 4 === 2 ? 1 : 3;
        g.set(x0, y, y === top ? "▄" : "█", KEYS[SKIN + shade]);
        g.set(x0 + 1, y, y === top ? "▄" : "█", KEYS[SKIN + Math.max(0, shade - 1)]);
        g.set(x0 - 1, y, "▐", KEYS[SKIN]);
      }
      if (i < 3) g.set(x0, top - 1, "▄", KEYS[SKIN + 3]);
    });
    // thumb over the top edge
    for (let x = Math.round(hx - 3); x <= Math.round(hx + 1); x++) { g.set(x, 6, "▄", KEYS[SKIN + 3]); g.set(x, 7, "█", KEYS[SKIN + 2]); }
    // pick: sweeps across the strings at the sound hole on each strum
    const sweep = clamp(sAge / 0.09);
    const py = up ? 21 - sweep * 14 : 7 + sweep * 14;
    const pxp = 90;
    g.text(pxp, Math.round(py) - 1, "▄█▄", KEYS[UI + 3]); g.text(pxp, Math.round(py), "▀█▀", KEYS[UI + 3]); g.set(pxp + 1, Math.round(py) + 1, "▀", KEYS[UI + 3]);
    for (let x = pxp + 3; x < pxp + 9; x++) { g.set(x, Math.round(py) - 1, "█", KEYS[SKIN + 3]); g.set(x, Math.round(py), "█", KEYS[SKIN + 2]); }
    // chord name tag
    g.fill(1, 0, 22, 3, " ", KEYS[UI + 4]);
    g.text(2, 1, "CHORD", KEYS[UI + 5]);
    g.text(8, 1, (ch.name + "  ").slice(0, 3), KEYS[UI + 3]);
    g.text(12, 1, up ? "↑ UP" : "↓ DOWN", KEYS[UI + 4]);
    return g.frame();
  };
}
