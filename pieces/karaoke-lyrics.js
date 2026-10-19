/* karaoke-lyrics: original lyrics filling with colour word by word under a bouncing ball, the next line waiting below. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "karaoke-lyrics",
  name: "Karaoke Lyrics",
  category: "lettering",
  note: "Original song lyrics fill with colour syllable by syllable under a hopping ball, the next line waiting below and a level meter dancing along.",
  tags: ["karaoke", "lyrics", "music", "text", "party", "hero"],
  cols: 78, rows: 22, fps: 30,
  // 0 sung, 1 unsung, 2 next line, 3 frame, 4 ball, 5 title, 6 muted, 7-9 meter low/mid/high, a bar fill
  palette: palette(["#5ff0e0", "#f4f1ea", "#5a6270", "#2b3140", "#ffd166", "#ff8fab", "#8b949e", "#3fbf8f", "#e3b341", "#ff6b6b", "#ff8fab"]),
};

const LYRICS = [
  "we hung our lanterns on the wire",
  "and watched the paper catch the light",
  "the river carried every fire",
  "downstream into the quiet night",
  "so hold the string and don't let go",
  "the wind is only passing through",
  "whatever's burning down below",
  "is burning up the sky for you",
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(7);
  // timing: each word gets a duration, lines get a breath between them
  let clock = 0.8;
  const plan = LYRICS.map((line) => {
    const words = line.split(" ");
    const sp = line.toUpperCase().split("").join(" ");
    const W = sp.length;
    const x0 = Math.floor((cols - W) / 2);
    let ci = 0;
    const ws = words.map((w) => {
      const dur = 0.28 + w.length * 0.06 + r() * 0.12;
      const o = { a: ci * 2, b: (ci + w.length - 1) * 2, t0: clock, t1: clock + dur };
      clock += dur; ci += w.length + 1;
      return o;
    });
    const p = { sp, x0, ws, start: ws[0].t0, end: clock };
    clock += 0.7;
    return p;
  });
  const total = clock + 1.2;
  const bars = 36;
  return (t) => {
    g.clear();
    const lt = ((t % total) + total) % total;
    // which line is current: the last one that has started, or the first one
    let li = 0;
    for (let i = 0; i < plan.length; i++) if (lt >= plan[i].start - 0.6) li = i;
    const P = plan[li];
    // frame + title
    g.box(0, 0, cols, rows, "round", "3");
    g.text(3, 1, "♥", "5");
    g.text(5, 1, "TRACK 03  ·  PAPER LANTERNS", "5");
    const verse = li < 4 ? "VERSE 1" : "CHORUS";
    g.text(cols - 3 - verse.length, 1, verse, "6");
    g.hline(1, cols - 2, 2, "─", "3");
    // current line, filled per character
    const LY = 8;
    for (let i = 0; i < P.sp.length; i++) {
      const ch = P.sp[i];
      if (ch === " ") continue;
      let sung = false;
      for (const w of P.ws) {
        if (i < w.a || i > w.b) continue;
        const f = (lt - w.t0) / (w.t1 - w.t0);
        sung = f >= (i - w.a + 1) / (w.b - w.a + 2);
      }
      if (lt > P.end) sung = true;
      g.set(P.x0 + i, LY, ch, sung ? "0" : "1");
    }
    // underline that grows with the line
    const prog = Math.max(0, Math.min(1, (lt - P.start) / (P.end - P.start)));
    const ul = Math.round(prog * P.sp.length);
    for (let i = 0; i < P.sp.length; i++) g.set(P.x0 + i, LY + 1, i < ul ? "▀" : "·", i < ul ? "0" : "3");
    // next line
    const N = plan[(li + 1) % plan.length];
    g.text(N.x0, LY + 4, N.sp, "2");
    // bouncing ball: hops from word to word
    let bx = P.x0 + P.ws[0].a, by = 0;
    for (let k = 0; k < P.ws.length; k++) {
      const w = P.ws[k];
      if (lt < w.t0) break;
      const cx = P.x0 + (w.a + w.b) / 2;
      const nxt = P.ws[k + 1];
      if (lt < w.t1 || !nxt) {
        const f = Math.min(1, (lt - w.t0) / (w.t1 - w.t0));
        const px = k === 0 ? cx : P.x0 + (P.ws[k - 1].a + P.ws[k - 1].b) / 2;
        const hop = Math.min(1, f * 2.2);
        bx = px + (cx - px) * hop;
        by = Math.sin(Math.PI * hop) * 2.6;
      }
    }
    if (lt < P.start) { bx = P.x0 + P.ws[0].a; by = Math.abs(Math.sin((lt - P.start) * 5.2)) * 1.6; }
    g.set(Math.round(bx), Math.round(LY - 2 - by), "●", "4");
    // level meter
    const MY = rows - 4;
    for (let i = 0; i < bars; i++) {
      const x = Math.floor((cols - bars * 2) / 2) + i * 2;
      const beat = Math.abs(Math.sin(lt * 4.1 + i * 0.7)) * 0.5 + Math.abs(Math.sin(lt * 2.3 - i * 0.31)) * 0.5;
      const sing = lt > P.start && lt < P.end ? 1 : 0.45;
      const h = Math.max(1, Math.round(beat * 3 * sing));
      for (let j = 0; j < h; j++) g.set(x, MY - j, "▄", j >= 2 ? "9" : j >= 1 ? "8" : "7");
    }
    // song progress
    const sp = lt / total, bw = cols - 22, k = Math.round(sp * bw);
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    g.text(3, rows - 2, fmt(lt), "6");
    g.text(9, rows - 2, "━".repeat(k), "a");
    g.text(9 + k, rows - 2, "─".repeat(bw - k), "3");
    g.text(cols - 3 - 4, rows - 2, fmt(total), "6");
    return g.frame();
  };
}
