/* star-rating-review: a product review form where a rating fills, hover previews it, and a written review is sent. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "star-rating-review",
  name: "Star Rating Review",
  category: "screens",
  note: "A review card where the cursor hovers across five stars, settles on a rating, writes a short review and posts it to the tally.",
  tags: ["rating", "review", "stars", "form", "ecommerce", "app"],
  cols: 72, rows: 22, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const STAR = ["   ▲   ", "▀▀███▀▀", " ▗▛ ▜▖ "];
const LABEL = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
const TEXT = "Sturdy, quiet and the battery easily lasts a full week.";
const PERIOD = 14;
const BASE = [212, 64, 31, 12, 9];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // hover sweeps 1..5 then back to 4, click at 3.2
    const hoverPath = [[0.6, 1], [1.0, 2], [1.4, 3], [1.8, 4], [2.2, 5], [2.8, 4]];
    let hov = 0; for (const [a, v] of hoverPath) if (lt >= a) hov = v;
    const clicked = lt >= 3.2, rating = clicked ? 4 : 0;
    const shown = clicked ? rating : hov;
    const typeA = 4.0, nT = Math.max(0, Math.min(TEXT.length, Math.floor((lt - typeA) / 0.06)));
    const postT = typeA + TEXT.length * 0.06 + 0.8, posted = lt >= postT;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Write a review ", "0");
    g.box(2, 2, 10, 5, "round", "8");
    g.text(4, 3, "▄██▄", "3"); g.text(4, 4, "█▒▒█", "3"); g.text(4, 5, "▀██▀", "3");
    g.text(14, 3, "Trail Speaker Mini", "0");
    g.text(14, 4, "Portable · Slate grey", "1");
    g.text(14, 5, "Purchased Sep 28", "7");
    g.text(4, 8, "Your rating", "1");
    for (let i = 0; i < 5; i++) {
      const on = i < shown, x = 3 + i * 8;
      const pop = clicked && i === rating - 1 && lt < 3.6;
      STAR.forEach((r, k) => g.text(x, 9 + k, r, on ? (clicked ? "9" : "4") : "8"));
      if (pop) g.text(x - 1, 8, "·  ·", "9");
    }
    g.text(43, 10, LABEL[shown], shown ? (clicked ? "9" : "4") : "7");
    // cursor
    if (!clicked || lt < 3.6) {
      const tx = 3 + (Math.max(1, hov) - 1) * 8 + 3;
      g.set(tx, 11, "↖", "0");
    }
    g.box(4, 13, W - 8, 4, "round", lt >= typeA && !posted ? "3" : "8");
    const s = TEXT.slice(0, nT);
    g.text(s ? 6 : 7, 14, s || "What did you like or dislike?", s ? "0" : "7");
    if (lt >= typeA && !posted && Math.floor(lt * 3) % 2 === 0) g.set(6 + s.length, 14, "▏", "3");
    g.text(W - 14, 15, `${nT}/500`, "7");
    g.box(W - 20, 17, 16, 3, "round", posted ? "2" : nT > 10 ? "3" : "8");
    g.text(W - 18, 18, posted ? "✓ Posted" : "Post review", posted ? "2" : "0");
    // distribution
    const counts = BASE.slice(); if (posted) counts[1]++;
    const total = counts.reduce((a, b) => a + b, 0);
    const avg = (counts[0] * 5 + counts[1] * 4 + counts[2] * 3 + counts[3] * 2 + counts[4]) / total;
    g.text(48, 3, avg.toFixed(2), "9"); g.text(53, 3, `· ${total} reviews`, "1");
    counts.forEach((c, i) => {
      const y = 4 + i, bw = 14, f = Math.round((c / total) * bw * 1.6);
      g.text(48, y, String(5 - i), "1"); g.set(49, y, "■", "9");
      for (let k = 0; k < bw; k++) g.set(51 + k, y, k < f ? "█" : "░", k < f ? (posted && i === 1 && k === f - 1 ? "2" : "9") : "8");
      g.text(66, y, String(c).padStart(3), posted && i === 1 ? "2" : "7");
    });
    g.text(4, 18, "Shown publicly as Priya K.", "7");
    return g.frame();
  };
}
