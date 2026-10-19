/* computer-lab-terminals: a school computer lab with three terminals, each screen busy with its own program under a ticking wall clock. */
import { Grid, palette, gradient, KEYS, bigText } from "../lib/kit.js";

const WALL = gradient(["#2a2f3a", "#363c4a", "#2e3340"], 4);
const C = [...WALL, "#d8ccaa", "#b8ac8a", "#8a8068", "#5a5444", "#0c0e0c", "#33ff66", "#1a8a3a", "#ffb000", "#8a5a00", "#d0e8ff", "#6a8aaa",
  "#a8b0a0", "#3a2618", "#1f3a2a", "#5a3c26", "#6a4630", "#8a6040", "#f0f0e8", "#ff7b72", "#e6edf3", "#1c1f26", "#26292f", "#79c0ff", "#f2cc60"];

export const meta = {
  slug: "computer-lab-terminals",
  name: "School Computer Lab",
  category: "retro",
  note: "A school computer lab with three beige terminals on a long desk, one listing a BASIC program in green, one compiling in amber and one playing a bat and ball game, under a ticking wall clock.",
  tags: ["retro", "computer lab", "school", "terminals", "scene", "wallpaper"],
  cols: 112, rows: 36, fps: 20,
  palette: palette(C),
};
const K = (i) => KEYS[i];
const BEIGE = K(4), BEIGE2 = K(5), BEIGE3 = K(6), BEIGE4 = K(7), SCR = K(8);
const BASIC = ["10 PRINT \"GUESS MY NUMBER\"", "20 N=INT(RND(1)*100)+1", "30 INPUT \"YOUR GUESS\";G", "40 IF G<N THEN PRINT \"HIGHER\"", "50 IF G>N THEN PRINT \"LOWER\"", "60 IF G<>N THEN 30", "70 PRINT \"YOU GOT IT!\"", "80 END", "RUN", "GUESS MY NUMBER", "YOUR GUESS? 50", "LOWER", "YOUR GUESS? 25", "HIGHER", "YOUR GUESS? 37", "HIGHER", "YOUR GUESS? 43", "YOU GOT IT!", "READY."];
const COMPILE = ["$ cc -O2 stars.c", "stars.c: 212 lines", "pass 1: parse", "pass 2: types", "pass 3: code", "optimise  ok", "link  libm.a", "a.out  14,880 bytes", "$ ./a.out", "plotting 400 stars", "frame 1 ok", "frame 2 ok", "frame 3 ok", "done in 3.2 s", "$ ls", "a.out stars.c notes.txt", "$"];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const SW = 26, SH = 11;
  const scroll = (lines, t, rate, x0, y0, co) => {
    const n = Math.floor(t * rate) % (lines.length + 6);
    const vis = lines.slice(0, Math.min(lines.length, n));
    const top = Math.max(0, vis.length - (SH - 1));
    vis.slice(top).forEach((l, i) => g.text(x0, y0 + i, l.slice(0, SW - 1), co));
    if (Math.floor(t * 3) % 2 === 0) g.set(x0, y0 + Math.min(SH - 1, vis.length - top), "█", co);
  };
  const game = (t, x0, y0) => {
    // bricks
    const P = 9;
    const lt = t % P;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
      const hit = (r * 8 + c) % 5 === 1 && lt > 2 + ((r * 8 + c) % 7);
      if (!hit) g.text(x0 + 1 + c * 3, y0 + 1 + r, "▀▀", r === 0 ? K(22) : r === 1 ? K(27) : K(26));
    }
    const bx = 12 + Math.round(Math.asin(Math.sin(t * 1.9)) / (Math.PI / 2) * 11), by = 6 + Math.round(Math.asin(Math.sin(t * 2.7)) / (Math.PI / 2) * 3);
    g.set(x0 + bx, y0 + by, "●", K(13));
    const px = Math.max(1, Math.min(SW - 6, bx - 2));
    g.text(x0 + px, y0 + SH - 1, "▀▀▀▀", K(13));
    g.text(x0, y0, "SCORE " + String(40 + Math.floor(lt * 3) * 10).padStart(4, "0"), K(14));
  };
  return (t) => {
    g.clear();
    // wall
    for (let y = 0; y < 22; y++) for (let x = 0; x < W; x++) g.set(x, y, (x * 5 + y * 11) % 17 === 0 ? "▓" : "█", K(Math.min(3, Math.floor(y / 6))));
    // sign and clock
    g.fill(4, 1, 26, 5, "█", K(17));
    g.text(6, 2, "COMPUTER ROOM 4", K(23));
    g.text(6, 3, "no food or drink", K(15));
    g.text(6, 4, "save to your disk", K(15));
    // digital wall clock
    const secs = 14 * 3600 + 7 * 60 + Math.floor(t);
    const hh = String(Math.floor(secs / 3600) % 24).padStart(2, "0"), mm = String(Math.floor(secs / 60) % 60).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
    g.fill(72, 0, 36, 7, "█", K(24));
    g.fill(73, 0, 34, 7, " ");
    bigText(g, 75, 1, hh + ":" + mm + ":" + ss, K(22));
    // desk
    for (let y = 22; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y === 22 ? "▄" : (x + y * 3) % 9 === 0 ? "▓" : "█", y === 22 ? K(20) : y < 30 ? K(19) : K(16));
    g.fill(0, 30, W, 1, "▀", K(20));
    for (let y = 31; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, (x + y) % 4 === 0 ? "▒" : "█", (Math.floor(x / 8) + y) % 2 ? K(24) : K(25));
    // three terminals
    [0, 1, 2].forEach((i) => {
      const mx = 4 + i * 36, my = 7;
      g.fill(mx, my, 32, 15, "█", BEIGE);
      for (let y = my; y < my + 15; y++) { g.set(mx, y, "█", BEIGE2); g.set(mx + 31, y, "█", BEIGE3); }
      g.fill(mx, my + 14, 32, 1, "▀", BEIGE3);
      g.fill(mx + 2, my + 1, 28, 13, "█", BEIGE4);
      g.fill(mx + 3, my + 1, SW, SH + 1, " ", SCR);
      const sx = mx + 3, sy = my + 1;
      if (i === 0) scroll(BASIC, t + 3, 1.6, sx, sy, K(9));
      else if (i === 1) scroll(COMPILE, t + 6, 1.3, sx, sy, K(11));
      else game(t, sx, sy + 1);
      g.set(mx + 28, my + 13, "●", i === 1 ? K(11) : K(9));
      // stand and keyboard
      g.text(mx + 12, 22, "▀▀▀▀▀▀▀▀", BEIGE3);
      g.fill(mx + 3, 25, 26, 3, "█", BEIGE2);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 12; k++) g.set(mx + 4 + k * 2, 25 + r, "▪", (Math.floor(t * 6) + k * 3 + r * 5 + i * 7) % 23 === 0 && i < 2 ? K(21) : BEIGE4);
      g.text(mx + 10, 28, "▀▀▀▀▀▀▀▀▀▀▀▀", BEIGE3);
    });
    // disk box and a mug-free desk
    g.text(36, 23, "▐█▌", K(26)); g.text(38, 24, "▐█▌", K(23));
    return g.frame();
  };
}
