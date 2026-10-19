/* word-ladder-morph: a word ladder where one letter at a time dissolves and re-forms, turning COLD into WARM step by step. */
import { Grid, palette, rng } from "../lib/kit.js";

/* 5x5 block font, drawn for this piece. */
const FONT = {
  A: ".###.|#...#|#####|#...#|#...#", B: "####.|#...#|####.|#...#|####.", C: ".####|#....|#....|#....|.####",
  D: "####.|#...#|#...#|#...#|####.", E: "#####|#....|####.|#....|#####", F: "#####|#....|####.|#....|#....",
  G: ".####|#....|#..##|#...#|.####", H: "#...#|#...#|#####|#...#|#...#", I: "#####|..#..|..#..|..#..|#####",
  K: "#...#|#..#.|###..|#..#.|#...#", L: "#....|#....|#....|#....|#####", M: "#...#|##.##|#.#.#|#...#|#...#",
  N: "#...#|##..#|#.#.#|#..##|#...#", O: ".###.|#...#|#...#|#...#|.###.", P: "####.|#...#|####.|#....|#....",
  R: "####.|#...#|####.|#..#.|#...#", S: ".####|#....|.###.|....#|####.", T: "#####|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|.###.", V: "#...#|#...#|#...#|.#.#.|..#..", W: "#...#|#...#|#.#.#|##.##|#...#",
};
const bits = (c) => (FONT[c] || FONT.I).split("|").map((r) => [...r].map((ch) => ch === "#"));

const LADDERS = [
  ["COLD", "CORD", "WORD", "WORM", "WARM"],
  ["HEAD", "HEAL", "TEAL", "TELL", "TALL", "TAIL"],
  ["LOVE", "ROVE", "ROTE", "RATE", "HATE"],
];

export const meta = {
  slug: "word-ladder-morph",
  name: "Word Ladder Morph",
  category: "lettering",
  note: "A word ladder where one big letter at a time dissolves and re-forms into its neighbour, turning COLD into WARM while the steps are listed beside it.",
  tags: ["words", "morph", "puzzle", "letters", "hero", "text"],
  cols: 84, rows: 20, fps: 30,
  // 0 settled, 1 forming, 2 leaving, 3 muted, 4 frame, 5 changed letter, 6 done green, 7 dim
  palette: palette(["#e6edf3", "#79c0ff", "#ff7b72", "#8b949e", "#30363d", "#ffa657", "#7ee787", "#484f58"]),
};

const STEP = 1.5, MORPH = 0.7, END_HOLD = 2.2;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(17);
  // random order in which the 25 pixels of a slot switch over
  const order = [];
  for (let s = 0; s < 4; s++) { const o = [...Array(25).keys()].map((i) => [i, r()]).sort((a, b) => a[1] - b[1]).map((a) => a[0]); const rank = new Array(25); o.forEach((p, k) => (rank[p] = k)); order.push(rank); }
  const plans = LADDERS.map((L) => ({ L, dur: (L.length - 1) * STEP + END_HOLD + STEP }));
  const total = plans.reduce((a, p) => a + p.dur, 0);
  const X0 = 4, Y0 = 6, SW = 12; // each letter drawn 2 cells wide per pixel
  return (t) => {
    g.clear();
    let lt = ((t % total) + total) % total, li = 0;
    while (lt >= plans[li].dur) { lt -= plans[li].dur; li++; }
    const L = plans[li].L;
    const prevLadder = plans[(li + plans.length - 1) % plans.length].L;
    // step index and morph progress; step 0 morphs in from the last word of the previous ladder
    const si = Math.min(L.length - 1, Math.floor(lt / STEP));
    const st = lt - si * STEP;
    const from = si === 0 ? prevLadder[prevLadder.length - 1] : L[si - 1];
    const to = L[si];
    const m = Math.min(1, st / MORPH);
    // frame + header
    g.box(0, 0, cols, rows, "round", "4");
    g.text(3, 1, "WORD LADDER", "3");
    g.text(16, 1, `·  ${L[0]} to ${L[L.length - 1]}  ·  one letter per step`, "7");
    g.hline(1, cols - 2, 2, "─", "4");
    // big word
    for (let s = 0; s < 4; s++) {
      const a = bits(from[s]), b = bits(to[s]);
      const changing = from[s] !== to[s];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
        const p = j * 5 + i;
        const flipped = changing && order[s][p] / 25 < m;
        const on = flipped ? b[j][i] : a[j][i];
        let co = "0";
        if (changing && m < 1) co = flipped ? "1" : a[j][i] && !b[j][i] ? "2" : "0";
        else if (changing && st < MORPH + 0.5) co = "5";
        if (on) { g.set(X0 + s * SW + i * 2, Y0 + j, "█", co); g.set(X0 + s * SW + i * 2 + 1, Y0 + j, "█", co); }
        else if (changing && m < 1 && (a[j][i] || b[j][i])) { g.set(X0 + s * SW + i * 2, Y0 + j, "░", "4"); g.set(X0 + s * SW + i * 2 + 1, Y0 + j, "░", "4"); }
      }
      // marker under the changing slot
      if (changing && si > 0) g.text(X0 + s * SW + 3, Y0 + 6, "▲▲▲▲", "5");
    }
    const done = si === L.length - 1 && st > MORPH;
    g.text(X0, Y0 + 9, done ? `solved in ${L.length - 1} steps` : `step ${si} of ${L.length - 1}`, done ? "6" : "3");
    // the ladder so far
    const LX = 56;
    g.vline(LX - 3, 4, rows - 3, "│", "4");
    g.text(LX, 4, "STEPS", "3");
    L.forEach((w, k) => {
      const y = 6 + k * 2;
      if (k > si) { g.text(LX, y, "· · · ·", "7"); return; }
      const prev = k > 0 ? L[k - 1] : null;
      for (let c = 0; c < 4; c++) {
        const ch = prev && prev[c] !== w[c];
        g.set(LX + c * 2, y, w[c], ch ? "5" : k === si ? "0" : "3");
      }
      if (k < L.length - 1 && k < si) g.text(LX + 3, y + 1, "↓", "7");
      if (k === si) g.text(LX + 10, y, "◄", done ? "6" : "1");
    });
    return g.frame();
  };
}
