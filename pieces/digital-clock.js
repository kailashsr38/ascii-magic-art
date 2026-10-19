/* digital-clock: a big seven segment clock with ghosted unlit segments and a blinking colon. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "digital-clock",
  name: "Digital Clock",
  category: "lettering",
  note: "A big seven segment clock ticking through the seconds, with ghosted unlit segments and a blinking colon.",
  tags: ["clock", "time", "seven-segment", "dashboard", "hero"],
  cols: 72, rows: 16, fps: 12,
  palette: palette(["#ff6b5b", "#3a1f1f", "#8b949e", "#ffb3a8", "#30363d"]),
};

// segments a b c d e f g as bits
const DIG = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const Y0 = 2;
  const seg = (x, y, on, s) => {
    const co = on ? "0" : "1", ch = on ? "█" : "░";
    if (s === 0) g.hline(x + 2, x + 5, y, ch, co);
    if (s === 6) g.hline(x + 2, x + 5, y + 5, ch, co);
    if (s === 3) g.hline(x + 2, x + 5, y + 10, ch, co);
    const v = (cx, y0) => { for (let j = 0; j < 4; j++) { g.set(cx, y0 + j, ch, co); g.set(cx + 1, y0 + j, ch, co); } };
    if (s === 1) v(x + 6, y + 1);
    if (s === 2) v(x + 6, y + 6);
    if (s === 4) v(x, y + 6);
    if (s === 5) v(x, y + 1);
  };
  const digit = (x, d) => {
    for (let s = 0; s < 7; s++) if (!((DIG[d] >> s) & 1)) seg(x, Y0, false, s);
    for (let s = 0; s < 7; s++) if ((DIG[d] >> s) & 1) seg(x, Y0, true, s);
  };
  const colon = (x, on) => {
    for (const yy of [Y0 + 3, Y0 + 7]) { g.set(x, yy, on ? "█" : "░", on ? "0" : "1"); g.set(x + 1, yy, on ? "█" : "░", on ? "0" : "1"); }
  };
  return (t) => {
    g.clear();
    const total = 23 * 3600 + 59 * 60 + 48 + Math.floor(t);       // starts 12 s before midnight rolls over
    const s = total % 60, m = Math.floor(total / 60) % 60, h = Math.floor(total / 3600) % 24;
    const day = Math.floor(total / 86400);
    const blink = (t % 1) < 0.5;
    const xs = [3, 13, 27, 37, 51, 61];
    [Math.floor(h / 10), h % 10, Math.floor(m / 10), m % 10, Math.floor(s / 10), s % 10].forEach((d, i) => digit(xs[i], d));
    colon(23, blink); colon(47, blink);
    g.hline(3, 68, 14, "─", "4");
    g.text(3, 15, `${DAYS[(1 + day) % 7]}  ${String(14 + day).padStart(2, "0")} OCT`, "2");
    g.text(30, 15, "24H", "3");
    const al = "ALARM 06:30  ·";
    g.text(68 - al.length - 1, 15, al, "2");
    g.set(68, 15, "●", blink ? "0" : "1");
    return g.frame();
  };
}
