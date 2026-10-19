/* skeleton-loader: shimmering skeleton placeholders for a card list, then the real content fades in. */
import { Grid, palette, gradient, rng } from "../lib/kit.js";

const SK = gradient(["#1c2128", "#2d333b", "#444c56", "#636e7b"], 8); // 0-7 skeleton shimmer
const FADE = gradient(["#2d333b", "#8b949e", "#e6edf3"], 6);          // 8-d text fade
const pal = palette([...SK, ...FADE, "#79c0ff", "#7ee787", "#ff7b72", "#d2a8ff", "#ffa657", "#484f58"]);
// e blue, f green, g red, h purple, i orange, j border

export const meta = {
  slug: "skeleton-loader",
  name: "Skeleton Loader",
  category: "screens",
  note: "Shimmering skeleton placeholders for a feed of cards that dissolve into the real content.",
  tags: ["loader", "skeleton", "placeholder", "app", "feed"],
  cols: 64, rows: 26, fps: 24,
  palette: pal,
};

const POSTS = [
  ["MC", "Maya Chen", "@maya · 2m", "Shipped the new billing page today, the", "invoice export is finally one click.", "♥ 128   ↑ 24   ◆ 9", "h"],
  ["OH", "Omar Haddad", "@omar · 14m", "Postmortem for Tuesday's staging outage", "is up, connection pool limits were to blame.", "♥ 64   ↑ 11   ◆ 3", "e"],
  ["LP", "Lena Park", "@lena · 1h", "Offsite poll closes Friday. Lake cabins", "are winning by a mile so far.", "♥ 212   ↑ 40   ◆ 17", "f"],
];
const PERIOD = 9;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols;
  const r = rng(5);
  const thr = Array.from({ length: W * meta.rows }, () => r());
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.text(2, 0, "Feed", "d"); g.text(8, 0, "Following", "a"); g.text(W - 12, 0, "↓ refresh", lt < 4 ? "e" : "a");
    POSTS.forEach((p, i) => {
      const x = 1, y = 2 + i * 8, w = W - 2, h = 7;
      g.box(x, y, w, h, "round", "j");
      const reveal = Math.max(0, Math.min(1, (lt - 3.6 - i * 0.45) / 0.8)) * (1 - Math.max(0, Math.min(1, (lt - 8.4) / 0.5)));
      // skeleton cells: [x, y, len] bars
      const bars = [[x + 2, y + 1, 6, 3], [x + 10, y + 1, 18, 1], [x + 10, y + 2, 11, 1], [x + 2, y + 4, 44, 1], [x + 2, y + 5, 36, 1]];
      // real content
      const txt = [];
      const put = (xx, yy, s, c) => { for (let k = 0; k < s.length; k++) txt.push([xx + k, yy, s[k], c]); };
      put(x + 2, y + 1, "╭────╮", p[6]); put(x + 2, y + 2, "│ " + p[0] + " │", p[6]); put(x + 2, y + 3, "╰────╯", p[6]);
      put(x + 10, y + 1, p[1], "d"); put(x + 10, y + 2, p[2], "a");
      put(x + 2, y + 4, p[3], "c"); put(x + 2, y + 5, p[4], "c");
      put(x + w - 22, y + 1, p[5], "i");
      // the avatar swaps in as one piece so its frame is never half drawn
      const th = (xx, yy) => (xx >= x + 2 && xx < x + 8 && yy >= y + 1 && yy < y + 4 ? thr[x + 2 + (y + 1) * W] : thr[xx + yy * W]);
      if (reveal < 1) {
        for (const [bx, by, bl, bh] of bars) for (let yy = by; yy < by + bh; yy++) for (let xx = bx; xx < bx + bl; xx++) {
          if (th(xx, yy) < reveal) continue;
          const band = Math.cos((xx * 0.12 - yy * 0.25 - lt * 2.4) * 1.3);
          const k = Math.max(0, Math.min(7, Math.round(2 + Math.max(0, band) ** 6 * 5)));
          g.set(xx, yy, "█", String(k));
        }
      }
      if (reveal > 0) for (const [xx, yy, ch, c] of txt) {
        const tv = th(xx, yy);
        if (tv >= reveal) continue;
        const f = Math.min(1, (reveal - tv) * 3);
        const col = /^[a-d]$/.test(c) ? "89abcd"[Math.min("89abcd".indexOf(c), Math.floor(f * 5))] : f < 0.5 ? "a" : c;
        if (ch !== " ") g.set(xx, yy, ch, col);
        else g.set(xx, yy, " ");
      }
    });
    return g.frame();
  };
}
