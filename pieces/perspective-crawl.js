/* perspective-crawl: an opening text crawl of block letters receding into space toward a vanishing point over a starfield. */
import { Grid, palette, gradient, KEYS, rng, clamp } from "../lib/kit.js";

/* 5x5 block font, drawn for this piece. */
const FONT = {
  A: ".###.|#...#|#####|#...#|#...#", B: "####.|#...#|####.|#...#|####.", C: ".####|#....|#....|#....|.####",
  D: "####.|#...#|#...#|#...#|####.", E: "#####|#....|####.|#....|#####", F: "#####|#....|####.|#....|#....",
  G: ".####|#....|#..##|#...#|.####", H: "#...#|#...#|#####|#...#|#...#", I: "#####|..#..|..#..|..#..|#####",
  J: "..###|....#|....#|#...#|.###.", K: "#...#|#..#.|###..|#..#.|#...#", L: "#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#...#|#...#", N: "#...#|##..#|#.#.#|#..##|#...#", O: ".###.|#...#|#...#|#...#|.###.",
  P: "####.|#...#|####.|#....|#....", Q: ".###.|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|####.|#..#.|#...#",
  S: ".####|#....|.###.|....#|####.", T: "#####|..#..|..#..|..#..|..#..", U: "#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|.#.#.|..#..", W: "#...#|#...#|#.#.#|##.##|#...#", X: "#...#|.#.#.|..#..|.#.#.|#...#",
  Y: "#...#|.#.#.|..#..|..#..|..#..", Z: "#####|...#.|..#..|.#...|#####",
  ".": ".....|.....|.....|.....|..#..", ",": ".....|.....|.....|..#..|.#...", "'": "..#..|..#..|.....|.....|.....",
  "-": ".....|.....|.###.|.....|.....", " ": ".....|.....|.....|.....|.....",
};

const TEXT = [
  "CHAPTER FOUR", "", "THE QUIET", "ORBIT", "", "",
  "IT IS A TIME", "OF LONG", "NIGHTS ON", "THE OUTER", "COLONIES.", "",
  "A SMALL CREW", "OF MAPMAKERS", "HAS FOUND A", "SIGNAL IN", "THE STATIC", "OF A DYING", "STAR.", "",
  "NOBODY KNOWS", "WHO SENT IT,", "OR WHY IT", "SOUNDS LIKE", "A LULLABY.", "",
  "WITH FUEL", "FOR ONE", "CROSSING AND", "A CAT THAT", "REFUSES TO", "STAY BEHIND,", "THEY SET OUT", "FOR THE EDGE", "OF THE MAP.",
  "", "", "", "", "", "", "",
];

const YEL = gradient(["#2a220c", "#6b5418", "#c9a233", "#ffe066", "#fff4b8"], 9);
export const meta = {
  slug: "perspective-crawl",
  name: "Perspective Text Crawl",
  category: "lettering",
  note: "An opening text crawl of block letters slides away from the viewer toward a vanishing point, shrinking and dimming over a field of stars.",
  tags: ["crawl", "space", "intro", "hero", "film", "text"],
  cols: 96, rows: 34, fps: 30,
  palette: palette([...YEL, "#c9d1d9", "#5c6470", "#2b3240"]), // 0-8 text, 9 star, a dim star, b faint star
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LW = 12 * 6, LH = 7;
  const BW = LW, BH = TEXT.length * LH;
  const bmp = new Uint8Array(BW * BH);
  TEXT.forEach((line, li) => {
    const x0 = Math.floor((12 - line.length) / 2) * 6 + (line.length % 2 ? 3 : 0);
    [...line].forEach((c, k) => {
      const gl = (FONT[c] || FONT[" "]).split("|");
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#") {
        const x = x0 + k * 6 + i, y = li * LH + 1 + j;
        if (x >= 0 && x < BW) bmp[x + y * BW] = 1;
      }
    });
  });
  const r = rng(42);
  const stars = [];
  for (let i = 0; i < 120; i++) stars.push([Math.floor(r() * cols), Math.floor(r() * rows), r()]);
  const HY = 1.5, N = rows - HY, cx = cols / 2, B = BW / (cols * 0.92);
  const ZMAX = 8;
  const sample = (bx, by) => {
    if (bx < 0 || bx >= BW) return 0;
    const yy = ((Math.floor(by) % BH) + BH) % BH;
    return bmp[Math.floor(bx) + yy * BW];
  };
  return (t) => {
    g.clear();
    for (const [x, y, b] of stars) g.set(x, y, b > 0.85 ? "+" : b > 0.5 ? "·" : ".", b > 0.85 ? "9" : b > 0.5 ? "a" : "b");
    const S = t * 3.2 + BH * 0.18;
    for (let y = Math.ceil(HY); y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let cov = 0, zc = 0;
        for (let sy = 0; sy < 2; sy++) {
          const d = (y + 0.25 + sy * 0.5 - HY) / N;
          const z = 1 / d;
          if (z > ZMAX) continue;
          zc = z;
          const by = S - N * 0.85 * (z - 1);
          for (let sx = 0; sx < 2; sx++) {
            const bx = BW / 2 + (x + 0.25 + sx * 0.5 - cx) * z * B;
            cov += sample(bx, by);
          }
        }
        if (!cov) continue;
        const ch = zc < 2.6 ? (cov >= 2 ? "█" : "▒") : cov >= 4 ? "█" : cov === 3 ? "▓" : cov === 2 ? "▒" : "░";
        const lvl = clamp(1.08 - (zc - 1) / (ZMAX - 1.5));
        g.set(x, y, ch, KEYS[Math.max(0, Math.min(8, Math.round(lvl * 8)))]);
      }
    }
    return g.frame();
  };
}
