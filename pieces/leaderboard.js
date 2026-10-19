/* leaderboard: a ranked table with scores ticking up and rows sliding past each other. */
import { Grid, palette, fbm, clamp, smooth } from "../lib/kit.js";

export const meta = {
  slug: "leaderboard",
  name: "Leaderboard",
  category: "live-data",
  note: "A live ranked leaderboard with scores ticking up, rows sliding past each other and arrows marking every climb.",
  tags: ["leaderboard", "ranking", "scores", "game", "dashboard"],
  cols: 64, rows: 25, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#f2cc60", "#c9d1d9", "#e3a26b", "#7ee787", "#ff7b72", "#79c0ff", "#d2a8ff", "#56d4dd", "#161b22"]),
};

const PLAYERS = ["nova_k", "pixelwolf", "zer0cool", "mira.dev", "byteqween", "lowpoly", "ghost_42", "hexfox", "sunnyside", "tarn"];
const LOOP = 30, STEP = 1;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const score = (i, t) => {
    const base = 8200 - i * 140;
    const rate = 40 + 220 * ((i * 0.37 + 0.2) % 1);
    const burst = fbm(t * 0.25, i * 4.7, 3, 7);
    return Math.floor(base + rate * t + 900 * burst * (t / LOOP + 0.3));
  };
  const ranks = [];
  for (let k = 0; k <= LOOP / STEP + 1; k++) {
    const s = PLAYERS.map((_, i) => score(i, k * STEP));
    const order = s.map((_, i) => i).sort((a, b) => s[b] - s[a]);
    const r = []; order.forEach((p, n) => (r[p] = n));
    ranks.push(r);
  }
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const k = Math.floor(lt / STEP), f = smooth(clamp(((lt % STEP) / STEP) / 0.45));
    const cur = ranks[k], nxt = ranks[k + 1];
    g.box(0, 0, cols, rows, "round", "2");
    g.text(2, 0, " season 7 · ranked ", "0");
    g.text(cols - 12, 0, " ● live ", "6");
    g.text(2, 2, "#", "1"); g.text(6, 2, "player", "1"); g.text(22, 2, "score", "1"); g.text(30, 2, "", "1");
    g.text(36, 2, "progress", "1"); g.text(cols - 8, 2, "trend", "1");
    g.hline(1, cols - 2, 3, "─", "2");
    const scores = PLAYERS.map((_, i) => score(i, lt));
    const top = Math.max(...scores);
    const order = PLAYERS.map((_, i) => i).sort((a, b) => (nxt[b] - nxt[a]));
    for (const i of order) {
      const pos = cur[i] + (nxt[i] - cur[i]) * f;
      const y = 4 + Math.round(pos * 2);
      const rk = nxt[i];
      const medal = rk === 0 ? "3" : rk === 1 ? "4" : rk === 2 ? "5" : "1";
      g.text(1, y, String(rk + 1).padStart(2), medal);
      if (rk < 3) g.set(4, y, "●", medal);
      g.text(6, y, PLAYERS[i], rk < 3 ? "0" : "4");
      g.text(19, y, scores[i].toLocaleString("en-US").padStart(8), rk === 0 ? "3" : "0");
      const bw = 20, n = Math.round((scores[i] / top) * bw);
      for (let x = 0; x < bw; x++) g.set(36 + x, y, x < n ? "█" : "░", x < n ? "89a96"[i % 5] : "2");
      // trend: compare against rank a few steps ago
      const prev = ranks[Math.max(0, k - 3)][i];
      const d = prev - rk;
      g.text(cols - 7, y, d > 0 ? "▲ " + d : d < 0 ? "▼ " + -d : "─", d > 0 ? "6" : d < 0 ? "7" : "1");
      if (cur[i] !== nxt[i] && f < 1) g.set(cols - 3, y, d >= 0 ? "↑" : "↓", d >= 0 ? "6" : "7");
    }
    const left = Math.max(0, LOOP - lt);
    g.text(2, rows - 2, "round ends in", "1");
    g.text(16, rows - 2, `0:${String(Math.floor(left)).padStart(2, "0")}`, "3");
    g.text(30, rows - 2, "players online", "1");
    g.text(45, rows - 2, (1284 + Math.round(fbm(t * 0.3, 2, 2, 1) * 60)).toLocaleString("en-US"), "0");
    return g.frame();
  };
}
