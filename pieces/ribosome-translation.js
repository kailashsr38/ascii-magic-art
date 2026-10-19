/* ribosome-translation: a ribosome reading mRNA codon by codon while tRNAs deliver amino acids to a growing protein chain. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#08060e", "#0e0a18", "#141022", "#1a142c"], 4));
add("big", gradient(["#2a3a5a", "#34496e", "#3e5882", "#4a6896"], 4));
add("small", gradient(["#3a2a5a", "#4a366e", "#5a4282"], 3));
add("nt", ["#ff6b6b", "#ffd166", "#7ee787", "#58b4ff"]);       // A U G C
add("rna", ["#c8c0d8", "#8a809e"]);
add("trna", ["#ffa657", "#ffd2a8", "#c87a3a"]);
add("aa", ["#ff7b72", "#7ee787", "#79c0ff", "#d2a8ff", "#ffd166", "#56d4dd"]);
add("rf", ["#ff4a6a"]);
add("ui", ["#ffffff", "#8b949e", "#e6edf3"]);

export const meta = {
  slug: "ribosome-translation",
  name: "Ribosome Translation",
  category: "science",
  note: "A ribosome slides along mRNA three bases at a time as matching tRNAs drop in, link their amino acids into a growing protein and leave, until a stop codon releases the chain.",
  tags: ["protein-synthesis", "ribosome", "biology", "genetics", "education", "science"],
  cols: 100, rows: 30, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const CODONS = ["AUG", "GCU", "UGG", "AAA", "GAG", "UUC", "CAC", "GGU", "CUG", "ACC", "UAU", "UAA", "GCA", "UCC"];
const AMINO = ["Met", "Ala", "Trp", "Lys", "Glu", "Phe", "His", "Gly", "Leu", "Thr", "Tyr"];
const COMP = { A: "U", U: "A", G: "C", C: "G" };
const STEP = 2.6, PITCH = 8, PX = 45, MY = 22;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.12, y * 0.28, 3, 6);
  const NSTEP = 13;
  const ntc = (c) => K("nt", "AUGC".indexOf(c));
  const tRNA = (x, y, j, a = true) => {
    // x is the codon's left cell; body sits above it
    g.text(x, y, " ▄██▄", K("trna", 0));
    g.text(x - 1, y + 1, "▐██████▌", K("trna", 1));
    g.text(x - 1, y + 2, "▐█▀▀▀▀█▌", K("trna", 1));
    g.text(x, y + 3, " ▀██▀", K("trna", 2));
    g.text(x, y + 4, "  ││", K("trna", 2));
    const ac = CODONS[j].split("").map((c) => COMP[c]);
    for (let i = 0; i < 3; i++) g.set(x + i * 2, y + 5, ac[i], ntc(ac[i]));
    if (a && j < AMINO.length) g.text(x + 1, y - 1, AMINO[j], K("aa", j % 6));
  };
  return (t) => {
    g.clear();
    const T = t % (STEP * NSTEP);
    const s = Math.floor(T / STEP), f = (T - s * STEP) / STEP;
    const done = s >= 11;                          // stop codon reached
    const trans = s < 10 ? smooth(clamp((f - 0.6) / 0.3)) : 0;
    const off = (j) => PX + (j - s) * PITCH - trans * PITCH;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.6 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // large subunit
    for (let y = 2; y < 22; y++) for (let x = 16; x < 84; x++) {
      const q = ((x - 50) / 33) ** 2 + ((y - 12.5) / 10) ** 2;
      if (q > 1) continue;
      const v = tex[x + y * cols];
      g.set(x, y, q > 0.82 ? "█" : v > 0.5 ? "▓" : "▒", K("big", q > 0.82 ? 3 : Math.min(2, Math.floor(v * 3))));
    }
    // mRNA
    for (let x = 0; x < cols; x++) g.set(x, MY + 1, "▀", K("rna", 1));
    for (let j = 0; j < CODONS.length; j++) {
      const x0 = Math.round(off(j));
      for (let i = 0; i < 3; i++) g.set(x0 + i * 2, MY, CODONS[j][i], ntc(CODONS[j][i]));
    }
    // small subunit under the mRNA
    for (let y = MY + 1; y < 28; y++) for (let x = 22; x < 78; x++) {
      const q = ((x - 50) / 28) ** 2 + ((y - (MY + 1)) / 5.2) ** 2;
      if (q > 1) continue;
      g.set(x, y, q > 0.75 ? "█" : "▓", K("small", q > 0.75 ? 2 : y & 1));
    }
    g.text(PX - PITCH + 2, 25, "E", K("ui", 0)); g.text(PX + 2, 25, "P", K("ui", 0)); g.text(PX + PITCH + 2, 25, "A", K("ui", 0));
    // tRNAs
    if (!done) {
      // E site tRNA leaving
      if (s > 0 && f < 0.45) {
        const p = f / 0.45, x = Math.round(off(s - 1) - p * 10), y = Math.round(MY - 6 - p * 12);
        tRNA(x, y, s - 1, false);
      }
      tRNA(Math.round(off(s)), MY - 6, s, false);
      if (s < 10) {
        const p = smooth(clamp(f / 0.35));
        tRNA(Math.round(off(s + 1) + (1 - p) * 14), Math.round(MY - 6 - (1 - p) * 16), s + 1, f < 0.5);
      } else {
        const p = smooth(clamp(f / 0.35));
        g.text(Math.round(off(11)), Math.round(MY - 3 - (1 - p) * 14), "▐RF▌", K("rf"));
      }
    }
    // the polypeptide chain: newest residue at the tRNA, older ones up the exit tunnel
    const n = done ? 11 : s + 1 + (s < 10 && f > 0.5 ? 1 : 0);
    const holder = done ? null : s < 10 && f > 0.5 ? s + 1 : s;
    const float = done ? (s - 11 + f) * 4 : s === 10 && f > 0.5 ? (f - 0.5) * 6 : 0;
    for (let i = 0; i < n; i++) {
      const j = n - 1 - i;              // residue index
      let x, y;
      if (i === 0 && holder !== null) { x = Math.round(off(holder)) + 1; y = MY - 7; }
      else { const k = holder === null ? i : i - 1; y = 13 - k; x = 46; if (y < 1) { x = 46 - (1 - y) * 4; y = 1; } }
      if (float) { x -= Math.round(float * 2); y -= Math.round(float * 0.5); }
      if (y < 0 || x < 0 || x > cols - 4) continue;
      g.text(x, y, AMINO[j], K("aa", j % 6));
    }
    // labels
    g.text(1, 0, "TRANSLATION", K("ui", 0));
    g.text(1, 1, "mRNA → protein", K("ui", 1));
    g.text(1, MY, "5'", K("ui", 1)); g.text(cols - 3, MY, "3'", K("ui", 1));
    g.text(1, MY - 2, "mRNA", K("ui", 2));
    g.text(84, 6, "LARGE", K("ui", 2)); g.text(84, 7, "SUBUNIT", K("ui", 2));
    g.text(80, 25, "SMALL SUBUNIT", K("ui", 2));
    g.text(1, 3, "growing protein", K("ui", 2)); g.text(1, 4, "leaves the tunnel", K("ui", 1));
    const cod = done ? "" : s < 10 ? CODONS[s + 1] : "UAA";
    const msg = done ? "Stop codon: the finished protein is released." : s < 10 ? `codon ${cod} → anticodon ${cod.split("").map((c) => COMP[c]).join("")} → ${AMINO[s + 1]}` : "UAA is a stop codon: release factor binds";
    g.text(1, 28, msg.padEnd(60), K("ui", 0));
    g.text(66, 28, "▄██▄ tRNA", K("trna", 0));
    g.text(80, 28, "E P A sites", K("ui", 1));
    return g.frame();
  };
}
