/* vertical-haiku: original haiku brushed onto a hanging scroll in vertical columns read right to left, sealed, then rolled away. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "vertical-haiku",
  name: "Vertical Haiku Scroll",
  category: "lettering",
  note: "Original haiku are brushed onto a hanging scroll in vertical columns read right to left, finished with a red seal, while a leaf drifts past.",
  tags: ["haiku", "poem", "vertical", "scroll", "calm", "text"],
  cols: 50, rows: 38, fps: 20,
  // 0 ink, 1 wet ink, 2 paper edge, 3 rod, 4 seal, 5 muted, 6 leaf, 7 cord, 8 faint
  palette: palette(["#f1e9d6", "#ffd9a0", "#6b604c", "#a0703a", "#e5534b", "#8b8170", "#e08a3c", "#c9a46a", "#4a4436"]),
};

const HAIKU = [
  ["first frost on the gate", "a small sparrow tests the cold", "and decides to wait"],
  ["rain on the kettle", "the house leans in to listen", "for something boiling"],
  ["late moon in the well", "the bucket brings up its light", "then pours it back down"],
];
const CPS = 9, COL_GAP = 0.6, HOLD = 3.4, ROLL = 1.2;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const PX = 6, PW = cols - 12, PY = 4, PH = rows - 6;   // paper
  const plans = HAIKU.map((lines) => {
    let tt = 0.6;
    const L = lines.map((s) => { const o = { s, t0: tt }; tt += s.length / CPS + COL_GAP; return o; });
    return { L, done: tt, dur: tt + HOLD + ROLL + 0.4 };
  });
  const total = plans.reduce((a, p) => a + p.dur, 0);
  return (t) => {
    g.clear();
    let lt = ((t % total) + total) % total, pi = 0;
    while (lt >= plans[pi].dur) { lt -= plans[pi].dur; pi++; }
    const P = plans[pi];
    // the scroll rolls up from the bottom at the end, and unrolls at the start
    const unroll = Math.min(1, lt / 0.5);
    const rollUp = lt > P.done + HOLD ? Math.min(1, (lt - P.done - HOLD) / ROLL) : 0;
    const visH = Math.round(PH * unroll * (1 - rollUp));
    const bottom = PY + visH;
    // hanging cord and top rod
    g.line(cols / 2, 0, PX + 6, PY - 2, "·", "7");
    g.line(cols / 2, 0, PX + PW - 7, PY - 2, "·", "7");
    g.set(cols / 2, 0, "●", "3");
    for (let x = PX - 2; x < PX + PW + 2; x++) g.set(x, PY - 1, "█", "3");
    g.set(PX - 3, PY - 1, "◆", "3"); g.set(PX + PW + 2, PY - 1, "◆", "3");
    // paper edges
    for (let y = PY; y < bottom; y++) { g.set(PX, y, "│", "2"); g.set(PX + PW - 1, y, "│", "2"); }
    // text columns, right to left, on faint manuscript guides
    const colX = (i) => PX + PW - 8 - i * 9;
    for (let i = 0; i < 4; i++) {
      const gx = colX(i) + 4;
      if (gx <= PX || gx >= PX + PW - 1) continue;
      for (let y = PY + 1; y < bottom - 1; y++) g.set(gx, y, "┊", "8");
    }
    for (let i = 0; i < 3; i++) for (let y = PY + 2; y < Math.min(bottom, PY + 2 + P.L[i].s.length); y++) g.set(colX(i), y, "·", "8");
    P.L.forEach((ln, i) => {
      for (let k = 0; k < ln.s.length; k++) {
        const age = lt - (ln.t0 + k / CPS);
        if (age < 0) break;
        const y = PY + 2 + k;
        if (y >= bottom) continue;
        g.set(colX(i), y, ln.s[k], age < 0.25 ? "1" : "0");
      }
    });
    // brush tip where the next letter goes
    const cur = P.L.find((ln) => lt >= ln.t0 && lt < ln.t0 + ln.s.length / CPS);
    if (cur) {
      const i = P.L.indexOf(cur), k = Math.floor((lt - cur.t0) * CPS);
      if (PY + 2 + k < bottom) g.set(colX(i), PY + 2 + k, "▼", "1");
    }
    // red seal after the last column
    if (lt > P.done - 0.2) {
      const sx = colX(2) - 6, sy = PY + PH - 7;
      if (sy + 2 < bottom) {
        g.text(sx, sy, "▄▄▄▄", "4"); g.text(sx, sy + 1, "█  █", "4"); g.text(sx, sy + 2, "▀▀▀▀", "4");
        g.text(sx + 1, sy + 1, String(pi + 1).padStart(2, "0"), "0");
      }
    }
    // bottom rod rides with the paper
    for (let x = PX - 1; x < PX + PW + 1; x++) g.set(x, bottom, "▀", "3");
    g.set(PX - 2, bottom, "●", "3"); g.set(PX + PW + 1, bottom, "●", "3");
    // a leaf drifting down beside the scroll
    const lp = (t * 0.11) % 1;
    const ly = Math.floor(lp * (rows + 4)) - 2;
    const lx = Math.round(cols - 3 + Math.sin(t * 1.3) * 2 - lp * 4);
    g.set(lx, ly, "◆", "6");
    const lp2 = (t * 0.08 + 0.55) % 1;
    g.set(Math.round(2 + Math.sin(t * 1.1 + 2) * 1.5 + lp2 * 2), Math.floor(lp2 * (rows + 4)) - 2, "◆", "6");
    // caption
    const cap = `haiku ${pi + 1} of ${plans.length}   read right to left`;
    g.text(Math.floor((cols - cap.length) / 2), rows - 1, cap, "8");
    return g.frame();
  };
}
