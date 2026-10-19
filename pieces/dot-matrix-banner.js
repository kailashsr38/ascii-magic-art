/* dot-matrix-banner: a dot matrix printer printing a sideways banner on tractor-feed paper, the head racing back and forth. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "dot-matrix-banner",
  name: "Dot Matrix Banner",
  category: "retro",
  note: "A dot matrix printer prints a giant sideways banner on continuous tractor-feed paper, the head racing back and forth as the perforated sheet feeds up and away.",
  tags: ["retro", "printer", "banner", "dot matrix", "office", "hero"],
  cols: 72, rows: 36, fps: 24,
  palette: palette(["#f2ead6", "#d8ceb4", "#2a2a2c", "#4a4a4c", "#b8ae90", "#d8ccaa", "#b0a484", "#8a8068", "#5a5444", "#2a2826", "#7ee787", "#16401c", "#ffb03a", "#1c1c1e", "#3a3a3e"]),
};

const F = {
  H: "10001,10001,11111,10001,10001", E: "11111,10000,11110,10000,11111", L: "10000,10000,10000,10000,11111", O: "01110,10001,10001,10001,01110",
  W: "10001,10001,10101,11011,10001", R: "11110,10001,11110,10010,10001", D: "11110,10001,10001,10001,11110", P: "11110,10001,11110,10000,10000",
  A: "01110,10001,11111,10001,10001", Y: "10001,01010,00100,00100,00100", B: "11110,10001,11110,10001,11110", I: "11111,00100,00100,00100,11111",
  T: "11111,00100,00100,00100,00100", " ": "00000,00000,00000,00000,00000",
};
const MSG = "HAPPY BIRTHDAY ";
const LT = 0.16;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // paper lines: each holds 5 pixel flags (font rows)
  const lines = [];
  for (const c of MSG) {
    const rows = F[c].split(",");
    for (let x = 0; x < 5; x++) for (let k = 0; k < 3; k++) lines.push(rows.map((r) => r[x] === "1"));
    for (let k = 0; k < 4; k++) lines.push([false, false, false, false, false]);
  }
  const N = lines.length, PERIOD = N * LT;
  const PX = 7, PWID = 58, PRINT = 27, MX = PX + 4, PIX = 10;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const cur = Math.floor(lt / LT), f = (lt % LT) / LT;
    const ltr = cur % 2 === 0; // bidirectional printing
    // background: a desk
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, (x * 3 + y * 7) % 13 === 0 ? "▓" : "█", "d");
    // paper sheet
    for (let y = 0; y <= PRINT; y++) {
      const L = cur - (PRINT - y);
      for (let x = PX; x < PX + PWID; x++) g.set(x, y, "█", "0");
      // tractor holes on both margins, moving with the paper
      const hole = ((L % 2) + 2) % 2 === 0;
      g.set(PX + 1, y, hole ? " " : "█", "0"); g.set(PX + PWID - 2, y, hole ? " " : "█", "0");
      g.set(PX + 3, y, "┊", "4"); g.set(PX + PWID - 4, y, "┊", "4");
      // perforation between sheets
      if ((((L % 33) + 33) % 33) === 0) for (let x = PX; x < PX + PWID; x++) if (g.get(x, y) === "█") g.set(x, y, "╌", "4");
      // the banner, sideways: letter tops face right
      const li = ((L % N) + N) % N;
      const row = lines[li];
      for (let r = 0; r < 5; r++) {
        if (!row[r]) continue;
        for (let k = 0; k < PIX; k++) {
          const x = MX + (4 - r) * PIX + k;
          // the line under the head is only printed where the head has passed
          if (y === PRINT) { const hx = ltr ? f : 1 - f; const px = (x - MX) / (PIX * 5); if (ltr ? px > hx : px < hx) continue; }
          g.set(x, y, (x + y) % 2 ? "▒" : "▓", (x + y) % 3 ? "2" : "3");
        }
      }
    }
    // printer body
    g.fill(2, PRINT + 1, W - 4, H - PRINT - 1, "█", "5");
    g.fill(2, PRINT + 1, W - 4, 1, "▄", "6");
    g.text(PX - 1, PRINT + 1, "▐" + "▀".repeat(PWID) + "▌", "8");
    // head carriage
    const hx = ltr ? f : 1 - f;
    const hxx = Math.round(MX + hx * PIX * 5) - 2;
    g.text(hxx, PRINT + 1, "▐██▌", "9");
    g.text(PX, PRINT + 2, "▀".repeat(PWID), "7");
    g.fill(4, PRINT + 3, 52, 5, " ");
    g.text(5, PRINT + 4, "DOT MATRIX 9 PIN", "5");
    g.text(5, PRINT + 5, "▐████▌ ▐████▌ ▐████▌", "6");
    g.text(5, PRINT + 6, "ONLINE  FF     LF", "5");
    g.set(44, PRINT + 4, "●", Math.floor(t * 30) % 5 ? "a" : "b"); g.text(46, PRINT + 4, "ONLINE", "5");
    g.set(44, PRINT + 5, "●", "b"); g.text(46, PRINT + 5, "PAPER", "5");
    g.set(44, PRINT + 6, "●", "c"); g.text(46, PRINT + 6, "NLQ", "5");
    for (let x = 56; x < 68; x++) g.set(x, PRINT + 5, (x % 2) ? "▀" : "▄", "7");
    return g.frame();
  };
}
