/* word-exchange: a stock quote screen where everyday words trade like shares, with a tape, a quote table and a featured chart. */
import { Grid, palette, noise2 } from "../lib/kit.js";

export const meta = {
  slug: "word-exchange",
  name: "Word Exchange",
  category: "lettering",
  note: "Everyday words trade like shares on a quote screen, with a crawling tape, a table of prices that tick up and down and a chart for the word of the hour.",
  tags: ["ticker", "words", "market", "dashboard", "fun", "text"],
  cols: 96, rows: 26, fps: 20,
  // 0 text, 1 muted, 2 frame, 3 green, 4 red, 5 blue, 6 orange, 7 dim, 8 green flash, 9 red flash, a chart fill
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#7ee787", "#ff7b72", "#79c0ff", "#ffa657", "#484f58", "#d2ffd8", "#ffd6d2", "#1f6f43"]),
};

const WORDS = [
  ["COFFEE", 42.1], ["SUNDAY", 88.4], ["RAIN", 12.7], ["DEADLINE", 61.0], ["NAP", 23.9], ["WIFI", 99.2],
  ["PIZZA", 37.5], ["MONDAY", 8.3], ["SNOOZE", 19.6], ["TACOS", 27.4], ["SOCKS", 5.2], ["HOLIDAY", 74.8],
];
const SPARK = "▁▂▃▄▅▆▇█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const TICK = 0.5;
  const price = (k, tick) => {
    const base = WORDS[k][1];
    const v = noise2(tick * 0.09, k * 7.3, 3) - 0.5 + (noise2(tick * 0.3, k * 3.1, 9) - 0.5) * 0.12;
    return Math.max(0.5, base * (1 + v * 0.22));
  };
  const open = WORDS.map((_, k) => price(k, 0));
  return (t) => {
    g.clear();
    const tick = Math.floor(t / TICK), frac = (t % TICK) / TICK;
    // header
    g.box(0, 0, cols, rows, "light", "2");
    g.text(2, 1, "WORD EXCHANGE", "0");
    g.text(16, 1, "·  markets open  ·  prices in feelings", "1");
    const mins = 9 * 60 + 30 + Math.floor(t * 2);
    const clock = `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")} ET`;
    g.text(cols - 2 - clock.length, 1, clock, "1");
    g.set(cols - 4 - clock.length, 1, "●", "3");
    // tape
    g.hline(1, cols - 2, 2, "─", "2");
    let tape = "";
    const segs = [];
    WORDS.forEach(([w], k) => {
      const p = price(k, tick), ch = (p - open[k]) / open[k] * 100;
      const s0 = tape.length;
      tape += `${w} ${p.toFixed(2)} ${ch >= 0 ? "▲" : "▼"}${Math.abs(ch).toFixed(1)}%   `;
      segs.push([s0, s0 + w.length, tape.length, ch >= 0]);
    });
    const off = Math.floor(t * 10);
    for (let x = 2; x < cols - 2; x++) {
      const i = (x + off) % tape.length;
      const sg = segs.find((s) => i >= s[0] && i < s[2]);
      g.set(x, 3, tape[i], i < sg[1] ? "0" : sg[3] ? "3" : "4");
    }
    g.hline(1, cols - 2, 4, "─", "2");
    // quote table
    const TX = 2, TY = 6;
    g.text(TX, TY, "SYMBOL      LAST     CHG    %CHG   TODAY          VOL", "1");
    g.hline(TX, TX + 56, TY + 1, "─", "2");
    WORDS.forEach(([w], k) => {
      const y = TY + 2 + k;
      const p = price(k, tick), prev = price(k, tick - 1);
      const ch = p - open[k], pc = ch / open[k] * 100;
      const up = ch >= 0, moved = p - prev;
      const flash = frac < 0.35 && Math.abs(moved) > 0.004 * p;
      g.text(TX, y, w, "0");
      g.text(TX + 10, y, p.toFixed(2).padStart(7), flash ? (moved > 0 ? "8" : "9") : "0");
      g.text(TX + 19, y, ((up ? "+" : "") + ch.toFixed(2)).padStart(6), up ? "3" : "4");
      g.text(TX + 27, y, ((up ? "+" : "") + pc.toFixed(1) + "%").padStart(6), up ? "3" : "4");
      let sp = "";
      let lo = 1e9, hi = -1e9;
      const hist = [];
      for (let j = 13; j >= 0; j--) { const v = price(k, tick - j * 3); hist.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
      for (const v of hist) sp += SPARK[Math.min(7, Math.floor(((v - lo) / (hi - lo + 1e-6)) * 8))];
      g.text(TX + 35, y, sp, up ? "3" : "4");
      const vol = Math.floor(1200 + noise2(k * 2.1, tick * 0.05, 5) * 9000 + tick * (3 + k));
      g.text(TX + 50, y, (vol / 1000).toFixed(1).padStart(5) + "k", "1");
    });
    // featured chart: word of the hour
    const fk = Math.floor(t / 7) % WORDS.length;
    const CX = 62, CY = 6, CW = cols - CX - 3, CH = 12;
    g.box(CX - 1, CY - 1, CW + 2, CH + 5, "round", "2");
    const fp = price(fk, tick), fch = (fp - open[fk]) / open[fk] * 100;
    g.text(CX + 1, CY, WORDS[fk][0], "6");
    g.text(CX + 1 + WORDS[fk][0].length + 1, CY, fp.toFixed(2), "0");
    const lab = `${fch >= 0 ? "▲" : "▼"} ${Math.abs(fch).toFixed(2)}%`;
    g.text(CX + CW - 1 - lab.length, CY, lab, fch >= 0 ? "3" : "4");
    const pts = [];
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < CW; i++) { const v = price(fk, tick - (CW - 1 - i)); pts.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const top = CY + 2, h = CH - 1;
    let py = -1;
    pts.forEach((v, i) => {
      const yy = top + h - 1 - Math.round(((v - lo) / (hi - lo + 1e-6)) * (h - 1));
      for (let y = yy + 1; y < top + h; y++) g.set(CX + i, y, "░", "a");
      const a = py < 0 ? yy : Math.min(py, yy), b = py < 0 ? yy : Math.max(py, yy);
      for (let y = a; y <= b; y++) g.set(CX + i, y, "•", fch >= 0 ? "3" : "4");
      py = yy;
    });
    g.text(CX + 1, CY + CH + 1, `hi ${hi.toFixed(2)}  lo ${lo.toFixed(2)}`, "1");
    g.text(CX + 1, CY + CH + 2, "word of the hour", "7");
    // footer
    const adv = WORDS.filter((_, k) => price(k, tick) >= open[k]).length;
    g.text(2, rows - 2, `advancing ${adv}   declining ${WORDS.length - adv}   index `, "1");
    const idx = WORDS.reduce((a, _, k) => a + price(k, tick), 0);
    g.text(2 + 34, rows - 2, idx.toFixed(1), "5");
    return g.frame();
  };
}
