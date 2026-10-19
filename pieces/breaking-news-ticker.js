/* breaking-news-ticker: a live news graphic with a sliding breaking banner, typed headlines and a crawling ticker. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const BG = gradient(["#06122a", "#0d2350", "#173a78"], 5);
export const meta = {
  slug: "breaking-news-ticker",
  name: "Breaking News Ticker",
  category: "lettering",
  note: "A live news graphic where a red breaking banner slides in, each headline types itself into the lower third and a ticker crawls underneath.",
  tags: ["news", "ticker", "headline", "broadcast", "banner", "text"],
  cols: 96, rows: 26, fps: 30,
  // 0-4 backdrop, 5 skyline, 6 window, 7 red, 8 white, 9 panel dark text, a ticker bg text, b yellow, c muted, d panel, e live white
  palette: palette([...BG, "#040a18", "#d9b45a", "#e0282e", "#ffffff", "#0b1530", "#dce3ee", "#ffd23f", "#8ea0bf", "#f2f4f8", "#ffffff"]),
};

const STORIES = [
  ["RIVER BRIDGE REOPENS AFTER 14 MONTHS OF REPAIRS", "First buses cross at dawn, cycle lane opens next week"],
  ["COUNCIL APPROVES LATE NIGHT BUS ROUTES", "Six new routes to run until 3 am from next month"],
  ["HEAT WAVE EXPECTED TO BREAK BY THURSDAY", "Storms likely along the coast, cooler air to follow"],
  ["LIBRARY BOOK RETURNED 61 YEARS LATE", "Borrower pays the fine in coins and a thank you note"],
];
const TICKER = "MARKETS CLOSE HIGHER FOR THIRD DAY  ◆  HARBOR GULLS 3, NORTH RIDGE 1  ◆  TOMORROW: SUNNY, HIGH 24°  ◆  FERRY TIMETABLE CHANGES FROM MONDAY  ◆  CITY MARATHON ROADS CLOSE SUNDAY 6 AM  ◆  ZOO WELCOMES TWIN RED PANDAS  ◆  ";
const PER = 8;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(9);
  // a wide skyline the camera pans across
  const SW = 260, sky = new Array(SW);
  for (let x = 0; x < SW;) {
    const w = 3 + Math.floor(r() * 7), h = 3 + Math.floor(r() * 10) + (r() < 0.12 ? 4 : 0);
    for (let i = 0; i < w && x + i < SW; i++) sky[x + i] = h;
    x += w;
  }
  const win = new Uint8Array(SW * 20);
  for (let i = 0; i < win.length; i++) win[i] = r() < 0.22 ? 1 : 0;
  return (t) => {
    g.clear();
    // backdrop
    const pan = t * 2.2;
    for (let y = 0; y < 17; y++) {
      const k = Math.min(4, Math.floor(y / 3.4));
      for (let x = 0; x < cols; x++) g.set(x, y, y < 6 ? "█" : y < 11 ? "▓" : "▒", KEYS[k]);
    }
    for (let x = 0; x < cols; x++) {
      const sx = Math.floor(x + pan) % SW, h = sky[sx];
      for (let j = 0; j < h; j++) {
        const y = 16 - j;
        const lit = win[sx + j * SW] && j > 0 && j < h - 1;
        g.set(x, y, lit ? "▪" : "█", lit ? "6" : "5");
      }
    }
    // live badge + channel + clock
    g.text(2, 1, "▐", "7"); g.text(3, 1, "● LIVE", "8"); g.text(9, 1, "▌", "7");
    for (let i = 0; i < 6; i++) if (g.ch[3 + i + cols] === " ") g.set(3 + i, 1, "█", "7");
    g.text(11, 1, "ASCII NEWS 24", "8");
    const lt = ((t % (PER * STORIES.length)) + PER * STORIES.length) % (PER * STORIES.length);
    const si = Math.floor(lt / PER), st = lt - si * PER;
    const mins = 21 * 60 + 40 + Math.floor((t / 60) % 60);
    const clock = `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    g.text(cols - 2 - clock.length, 1, clock, "8");
    g.text(cols - 2 - clock.length - 9, 1, "HARBOR", "c");
    // lower third
    const [head, sub] = STORIES[si];
    const slide = Math.min(1, st / 0.45);
    const out = st > PER - 0.5 ? (st - (PER - 0.5)) / 0.5 : 0;
    const LY = 18;
    const lab = " BREAKING NEWS ";
    const lx = Math.round(-lab.length + (lab.length + 2) * slide - out * 30);
    // panel: light rules above and below a dark strip, headline in white
    const pr = 2 + Math.round((cols - 4) * Math.min(1, Math.max(0, (st - 0.3) / 0.4)) * (1 - out));
    for (let x = 2; x < pr; x++) { g.set(x, LY, "▄", "d"); g.set(x, LY + 2, "▀", "d"); g.set(x, LY + 1, " "); }
    // red label block with white letters cut into it
    for (let y = LY; y < LY + 3; y++) for (let i = 0; i < lab.length + 2; i++) g.set(lx + i, y, "█", "7");
    for (let i = 0; i < lab.length; i++) if (lab[i] !== " ") g.set(lx + 1 + i, LY + 1, lab[i], "8");
    // headline typed in
    const hx = lab.length + 6;
    const n = Math.max(0, Math.min(head.length, Math.floor((st - 0.8) * 30)));
    if (!out) {
      for (let i = 0; i < n; i++) g.set(hx + i, LY + 1, head[i], "8");
      if (n < head.length && st > 0.8) g.set(hx + n, LY + 1, "▌", "7");
      if (st > 2.4) g.text(hx, LY + 3, sub.slice(0, Math.floor((st - 2.4) * 40)), "a");
    }
    // ticker
    const TY = rows - 2;
    for (let x = 0; x < cols; x++) { g.set(x, TY - 1, "▄", "4"); g.set(x, TY + 1, "▀", "4"); }
    const off = Math.floor(t * 12);
    for (let x = 14; x < cols; x++) g.set(x, TY, TICKER[(x + off) % TICKER.length], "a");
    for (let x = 14; x < cols; x++) if (TICKER[(x + off) % TICKER.length] === "◆") g.set(x, TY, "◆", "7");
    g.text(1, TY, " LATEST ►  ", "b");
    return g.frame();
  };
}
