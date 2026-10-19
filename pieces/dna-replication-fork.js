/* dna-replication-fork: helicase unzips DNA while the leading strand grows smoothly and the lagging strand is built in Okazaki fragments. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#060a14", "#0a1020", "#0e162a", "#121c34"], 4));
add("base", ["#ff6b6b", "#ffd166", "#7ee787", "#58b4ff"]);   // A T G C
add("old", ["#5a6a8a", "#8494b4"]);
add("rna", ["#ff7bd0"]);
add("heli", ["#ffa04a", "#ffd0a0"]);
add("pol", ["#b48cff", "#ddc8ff"]);
add("lig", ["#56e0d0"]);
add("ui", ["#e6edf3", "#8b949e", "#ffffff"]);

export const meta = {
  slug: "dna-replication-fork",
  name: "DNA Replication Fork",
  category: "science",
  note: "Helicase unzips the double helix, the leading strand is copied in one smooth run and the lagging strand in short Okazaki fragments that are primed, filled and sealed, base letters and all.",
  tags: ["dna", "replication", "biology", "genetics", "education", "science"],
  cols: 104, rows: 30, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const BASES = "ATGC", PAIR = { A: "T", T: "A", G: "C", C: "G" }, RPAIR = { A: "U", T: "A", G: "C", C: "G" };
const FORK = 66, V = 2.2, P = 4.5, W = 7;

function baseAt(u) {
  let h = Math.imul(u | 0, 2654435761) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return BASES[(h >>> 7) & 3];
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.1, y * 0.25, 3, 3);
  const yT = (x) => (x >= FORK ? 12 : Math.max(5, 12 - Math.round((FORK - x) * 0.3)));
  const yB = (x) => (x >= FORK ? 18 : Math.min(25, 18 + Math.round((FORK - x) * 0.3)));
  const bc = (b) => K("base", BASES.indexOf(b));
  return (t) => {
    g.clear();
    const shift = V * t, sh = Math.floor(shift);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.6 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    for (let x = 0; x < cols; x++) {
      const u = x + sh, top = baseAt(u), bot = PAIR[top];
      g.set(x, yT(x), top, K("old", 1));
      g.set(x, yB(x), bot, K("old", 1));
      if (x > FORK + 1) {
        g.set(x, 13, "│", bc(top)); g.set(x, 14, "│", bc(top));
        g.set(x, 15, "│", bc(bot)); g.set(x, 16, "│", bc(bot)); g.set(x, 17, "│", bc(bot));
        g.set(x, 11, "▄", K("old", 0)); g.set(x, 19, "▀", K("old", 0));
      } else {
        g.set(x, yT(x) - 1, "▄", K("old", 0)); g.set(x, yB(x) + 1, "▀", K("old", 0));
      }
    }
    // leading strand: continuous, right behind the fork
    const LP = FORK - 5;
    for (let x = 0; x <= LP; x++) g.set(x, yT(x) + 1, PAIR[baseAt(x + sh)], bc(PAIR[baseAt(x + sh)]));
    g.text(LP + 1, yT(LP + 1) + 1, "▐█▌", K("pol", 0));
    // lagging strand: fragments started near the fork, built away from it
    const kNow = Math.floor(t / P), gap = Math.round(V * P);
    for (let k = kNow; k >= kNow - 12 && k >= kNow - 12; k--) {
      const age = t - k * P;
      if (age < 0) continue;
      const xs = Math.round(FORK - 4 - V * age);
      if (xs < -gap) break;
      const L = Math.min(gap - 1, Math.floor(W * Math.max(0, age - 0.6)));
      const primed = age > 0.3, primerGone = age > 3.6, sealed = age > 4.2;
      for (let i = 0; i <= L + 2; i++) {
        const x = xs - i + 2;
        if (x < 0 || x >= cols) continue;
        const tb = PAIR[baseAt(x + sh)];
        const y = yB(x) - 1;
        if (i <= 2) {
          if (!primed) continue;
          if (!primerGone) g.set(x, y, RPAIR[tb], K("rna"));
          else g.set(x, y, PAIR[tb], bc(PAIR[tb]));
          continue;
        }
        if (i - 2 > L) continue;
        g.set(x, y, PAIR[tb], bc(PAIR[tb]));
      }
      // nick before ligase seals it, polymerase while growing
      const nx = xs - gap + 2;
      if (L >= gap - 1 && !sealed && nx >= 0) g.set(nx, yB(nx) - 1, "·", K("ui", 1));
      if (age > 3.6 && !sealed && nx >= 0) g.set(nx, yB(nx) - 2, "◆", K("lig"));
      if (age > 0.6 && L < gap - 1) { const px = xs - L - 1; g.text(px - 1, yB(px) - 1, "▐█▌", K("pol", 0)); }
    }
    // helicase at the fork
    g.text(FORK - 1, 14, "▄█▄", K("heli", 0));
    g.text(FORK - 1, 15, "███", K("heli", 1));
    g.text(FORK - 1, 16, "▀█▀", K("heli", 0));
    // labels
    g.text(1, 0, "DNA REPLICATION FORK", K("ui", 2));
    g.text(74, 0, "parent DNA (double helix)", K("ui", 0));
    g.text(102, 10, "5'", K("ui", 1)); g.text(102, 20, "3'", K("ui", 1));
    g.text(70, 22, "HELICASE", K("heli", 0)); g.text(70, 23, "unzips the", K("ui", 1)); g.text(70, 24, "base pairs", K("ui", 1));
    g.set(68, 20, "↑", K("heli", 0)); g.set(68, 21, "│", K("heli", 0));
    g.text(1, 2, "LEADING STRAND: copied continuously toward the fork", K("ui", 0));
    g.text(1, 27, "LAGGING STRAND: built away from the fork in Okazaki fragments", K("ui", 0));
    g.text(1, 28, "▐█▌", K("pol", 0)); g.text(5, 28, "DNA polymerase", K("ui", 1));
    g.text(21, 28, "AUG", K("rna")); g.text(25, 28, "RNA primer", K("ui", 1));
    g.text(37, 28, "◆", K("lig")); g.text(39, 28, "ligase seals the gap", K("ui", 1));
    g.text(61, 28, "A", K("base", 0)); g.text(62, 28, "T", K("base", 1)); g.text(63, 28, "G", K("base", 2)); g.text(64, 28, "C", K("base", 3));
    g.text(66, 28, "new bases", K("ui", 1));
    g.text(1, 4, "3'", K("ui", 1)); g.text(1, 26, "5'", K("ui", 1));
    return g.frame();
  };
}
