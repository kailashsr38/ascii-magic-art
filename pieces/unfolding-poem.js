/* unfolding-poem: an original poem written out line by line behind a pen cursor, held, then lifted away for the next. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "unfolding-poem",
  name: "Unfolding Poem",
  category: "lettering",
  note: "An original poem is written out line by line behind a pen cursor, each letter settling from faint to full ink, then lifts away for the next poem.",
  tags: ["poem", "poetry", "writing", "reading", "text", "quiet"],
  cols: 64, rows: 26, fps: 24,
  // 0 full ink, 1 mid, 2 faint, 3 title, 4 rule, 5 muted, 6 cursor
  palette: palette(["#efe6d2", "#a99f8a", "#5c5547", "#e8b86a", "#4a4436", "#857c6a", "#f2c879"]),
};

const POEMS = [
  ["LATE FERRY", [
    "the last ferry leaves at ten",
    "and takes the harbour lights along,",
    "a row of small unhurried stars",
    "that hum a half-remembered song.",
    "",
    "I stay to watch the water close",
    "behind it like a folded page,",
    "the gulls asleep along the posts",
    "like commas waiting on a stage.",
  ]],
  ["KETTLE", [
    "before the house is fully up",
    "the kettle starts its little climb,",
    "a low note rising in the cup",
    "of morning, keeping its own time.",
    "",
    "the window holds a pale grey square,",
    "the cat rehearses being still,",
    "and steam writes nothing on the air",
    "and then erases it at will.",
  ]],
];
const CPS = 26, LINE_GAP = 0.55, HOLD = 3.2, FADE = 1.6;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const plans = POEMS.map(([title, lines]) => {
    let tt = 0.9;
    const L = lines.map((s) => { const o = { s, t0: tt }; tt += s ? s.length / CPS + LINE_GAP : 0.35; return o; });
    return { title, L, written: tt, dur: tt + HOLD + FADE + 0.4 };
  });
  const total = plans.reduce((a, p) => a + p.dur, 0);
  const W = 38, X0 = Math.floor((cols - W) / 2), Y0 = 6;
  return (t) => {
    g.clear();
    let lt = ((t % total) + total) % total, pi = 0;
    while (lt >= plans[pi].dur) { lt -= plans[pi].dur; pi++; }
    const P = plans[pi];
    const fading = lt > P.written + HOLD;
    const fo = fading ? (lt - P.written - HOLD) / FADE : 0;   // 0..1, lines lift from the top down
    // title + ornament
    const tl = P.title.split("").join(" ");
    const tx = Math.floor((cols - tl.length) / 2);
    const tcol = fo > 0.85 ? "2" : fo > 0.6 ? "1" : "3";
    g.text(tx, 2, tl, tcol);
    const rule = "──────── ◇ ────────";
    g.text(Math.floor((cols - rule.length) / 2), 4, rule, fo > 0.85 ? "2" : "4");
    let cx = -1, cy = -1;
    P.L.forEach((ln, i) => {
      if (!ln.s) return;
      const y = Y0 + i * 2;
      const lift = fading ? fo * (P.L.length + 3) - i : -1;   // > 0 means this line is going
      if (lift > 1) return;
      const dy = lift > 0 ? -Math.round(lift * 1) : 0;
      for (let k = 0; k < ln.s.length; k++) {
        const age = lt - (ln.t0 + k / CPS);
        if (age < 0) { if (cx < 0) { cx = X0 + k; cy = y; } break; }
        const co = lift > 0.5 ? "2" : lift > 0 ? "1" : age < 0.12 ? "2" : age < 0.3 ? "1" : "0";
        g.set(X0 + k, y + dy, ln.s[k], co);
      }
    });
    // pen cursor where the next letter lands, or resting after the last line
    if (!fading) {
      if (cx < 0) {
        const last = P.L[P.L.length - 1];
        cx = X0 + last.s.length + 1; cy = Y0 + (P.L.length - 1) * 2;
        if ((lt % 1.1) < 0.6) g.set(cx, cy, "▌", "6");
      } else g.set(cx, cy, "▌", "6");
    }
    // footer
    const foot = `poem ${pi + 1} of ${plans.length}`;
    g.text(Math.floor((cols - foot.length) / 2), rows - 2, foot, "5");
    g.text(2, rows - 2, "·", "4"); g.text(cols - 3, rows - 2, "·", "4");
    return g.frame();
  };
}
