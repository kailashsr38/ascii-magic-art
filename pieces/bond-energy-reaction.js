/* bond-energy-reaction: hydrogen and oxygen molecules breaking their bonds and re-forming as water, with the energy profile and bond energy sums. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, lerp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#06080c", "#0a0e16", "#0e1420", "#121a2a"], 4));
add("H", gradient(["#5a6070", "#9aa2b4", "#d8deea", "#ffffff"], 4));
add("O", gradient(["#5a0a0a", "#a01a1a", "#e03a2a", "#ff9a8a"], 4));
add("bond", ["#c8c8d0", "#ffd166"]);
add("heat", ["#ff7a2a", "#ffd166"]);
add("curve", ["#3a4a6a", "#79c0ff"]);
add("ui", ["#ffffff", "#8b949e", "#30363d", "#7ee787", "#ff7b72", "#ffd166"]);

export const meta = {
  slug: "bond-energy-reaction",
  name: "Bonds Break And Form",
  category: "science",
  note: "Two hydrogen molecules and one oxygen molecule absorb energy to break their bonds, the atoms regroup into two water molecules and more energy is released, traced on an energy profile.",
  tags: ["chemistry", "reaction", "bonds", "energy", "education", "science"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const PER = 14;
// atoms: H1 H2 (molecule A), H3 H4 (molecule B), O1 O2
const REACT = [[8, 6], [16, 6], [8, 18], [16, 18], [32, 12], [42, 12]];
const BROKEN = [[4, 4], [20, 5], [4, 20], [20, 19], [28, 10], [47, 14]];
const PROD = [[12.8, 9], [28.2, 9], [34.8, 20], [50.2, 20], [20.5, 6], [42.5, 17]];
const RADIUS = [1.6, 1.6, 1.6, 1.6, 2.4, 2.4];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.1, y * 0.25, 3, 19);
  const ball = (cx, cy, R, kind) => {
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R * 2); x <= cx + R * 2; x++) {
      const nx = (x + 0.5 - cx) / (R * 2), ny = (y + 0.5 - cy) / R, q = nx * nx + ny * ny;
      if (q > 1) continue;
      const l = clamp(0.25 + Math.sqrt(1 - q) * 0.55 - nx * 0.25 - ny * 0.3);
      g.set(x, y, "█", K(kind, Math.min(3, Math.floor(l * 4))));
    }
    g.set(Math.round(cx), Math.round(cy), kind, K("ui", 2));
  };
  const bondLine = (a, b, ch, co) => g.line(a[0], a[1], b[0], b[1], ch, co);
  // energy profile panel
  const PX = 60, PW = 38, PY = 2, PH = 18;
  const prof = (u) => {
    const r = 9, p = 15.5, top = 2.5;
    if (u < 0.2) return r;
    if (u < 0.5) return lerp(r, top, smooth((u - 0.2) / 0.3));
    if (u < 0.8) return lerp(top, p, smooth((u - 0.5) / 0.3));
    return p;
  };
  return (t) => {
    g.clear();
    const T = t % PER;
    // phases: 0-3 reactants, 3-5 bonds break, 5-8 regroup, 8-12 products, 12-14 hold
    const brk = smooth(clamp((T - 3) / 2)), grp = smooth(clamp((T - 5) / 3));
    const u = T < 3 ? 0.1 + (T / 3) * 0.1 : T < 8 ? 0.2 + ((T - 3) / 5) * 0.6 : 0.8 + Math.min(1, (T - 8) / 4) * 0.15;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.6 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    const pos = REACT.map((r, i) => {
      const b = BROKEN[i], p = PROD[i];
      const x = lerp(lerp(r[0], b[0], brk), p[0], grp), y = lerp(lerp(r[1], b[1], brk), p[1], grp);
      const jig = (T < 3 || T > 8 ? 0.4 : 0.8) * Math.sin(t * 7 + i * 2.1);
      return [x + jig, y + 0.3 * Math.cos(t * 6 + i)];
    });
    // old bonds fade as they break, new ones snap in
    if (brk < 0.5) {
      const ch = brk > 0.25 ? "·" : "─";
      bondLine(pos[0], pos[1], ch, K("bond", 0)); bondLine(pos[2], pos[3], ch, K("bond", 0));
      const o1 = pos[4], o2 = pos[5];
      g.line(o1[0], o1[1] - 0.5, o2[0], o2[1] - 0.5, brk > 0.25 ? "·" : "═", K("bond", 0));
    }
    if (grp > 0.85) {
      const ch = grp > 0.97 ? "─" : "·";
      for (const [h, o] of [[0, 4], [1, 4], [2, 5], [3, 5]]) bondLine(pos[h], pos[o], ch, K("bond", T < 9 ? 1 : 0));
    }
    // energy in (break) and out (form)
    if (T > 3 && T < 5.5) for (let k = 0; k < 10; k++) {
      const a = k * 0.63 + T, rr = 14 - (T - 3) * 4;
      g.set(26 + Math.cos(a) * rr * 2, 12 + Math.sin(a) * rr, "→", K("heat", 0));
    }
    if (T > 7.8 && T < 11) for (let k = 0; k < 16; k++) {
      const a = k * 0.39, rr = (T - 7.8) * 6;
      g.set(30 + Math.cos(a) * rr * 2, 13 + Math.sin(a) * rr, rr < 6 ? "*" : "~", K("heat", rr < 6 ? 1 : 0));
    }
    pos.forEach((p, i) => ball(p[0], p[1], RADIUS[i], i < 4 ? "H" : "O"));
    // energy profile
    g.fill(PX + 1, PY + 1, PW - 2, PH - 2, " ");
    g.box(PX, PY, PW, PH, "round", K("ui", 2));
    g.text(PX + 2, PY, " ENERGY PROFILE ", K("ui", 0));
    for (let i = 0; i < PW - 6; i++) {
      const uu = i / (PW - 7), y = Math.round(PY + prof(uu));
      g.set(PX + 4 + i, y, "▪", K("curve", 1));
    }
    const ux = PX + 4 + Math.round(u * (PW - 7));
    g.set(ux, Math.round(PY + prof(u)) - 1, "●", K("ui", 5));
    g.text(PX + 1, PY + 1, "energy", K("ui", 1)); g.set(PX + 2, PY + 2, "↑", K("ui", 1));
    g.text(PX + 2, PY + 8, "2H2+O2", K("ui", 0));
    g.text(PX + PW - 9, PY + 14, "2H2O", K("ui", 0));
    g.text(PX + 16, PY + 1, "atoms apart", K("ui", 1));
    g.text(PX + 10, PY + PH - 2, "reaction progress →", K("ui", 1));
    // numbers
    const SX = 60;
    g.text(SX, 21, "break  2 x H-H  2 x 436 =  872 kJ", K(T >= 3 ? "ui" : "ui", T >= 3 && T < 8 ? 4 : 1));
    g.text(SX, 22, "break  1 x O=O  1 x 498 =  498 kJ", K("ui", T >= 3 && T < 8 ? 4 : 1));
    g.text(SX, 23, "make   4 x O-H  4 x 463 = 1852 kJ", K("ui", T >= 7.5 ? 3 : 1));
    g.text(SX, 25, "1852 - 1370 = 482 kJ given out", K("ui", T >= 8 ? 5 : 1));
    g.text(SX, 26, "the reaction is EXOTHERMIC", K("ui", T >= 8 ? 5 : 1));
    // stage caption and equation
    const cap = T < 3 ? "Reactants: two H2 molecules and one O2 molecule."
      : T < 5 ? "Breaking bonds TAKES IN energy."
      : T < 8 ? "Free atoms regroup: each O takes two H."
      : "Making bonds GIVES OUT energy: two H2O molecules.";
    g.text(1, 25, "2 H2  +  O2  →  2 H2O", K("ui", 0));
    g.text(1, 27, cap.padEnd(54), K("ui", T < 3 ? 0 : T < 5 ? 4 : T < 8 ? 0 : 5));
    g.text(1, 0, "BONDS BREAK, BONDS FORM", K("ui", 0));
    g.text(1, 29, "average bond energies, gas phase", K("ui", 1));
    return g.frame();
  };
}
