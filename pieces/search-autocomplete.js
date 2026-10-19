/* search-autocomplete: a search box whose suggestion list filters and highlights matches as each query is typed. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "search-autocomplete",
  name: "Search Autocomplete",
  category: "screens",
  note: "A search box where suggestions narrow and highlight with every keystroke, then a result is picked with the arrow keys.",
  tags: ["search", "autocomplete", "input", "app", "filter"],
  cols: 70, rows: 22, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const DATA = [
  ["Barcelona", "City · Spain", "6"], ["Bangalore", "City · India", "6"], ["Bangkok", "City · Thailand", "6"],
  ["Banff National Park", "Park · Canada", "2"], ["Bali", "Island · Indonesia", "3"], ["Baltimore", "City · United States", "6"],
  ["Bandung", "City · Indonesia", "6"], ["Barbados", "Country · Caribbean", "4"], ["Barossa Valley", "Region · Australia", "2"],
  ["Copenhagen", "City · Denmark", "6"], ["Cape Town", "City · South Africa", "6"], ["Canary Islands", "Islands · Spain", "3"],
  ["Cappadocia", "Region · Turkey", "2"], ["Cancun", "City · Mexico", "6"], ["Cambridge", "City · United Kingdom", "6"],
];
const RUNS = [["bar", 2], ["cap", 1]];
const SEG = 7;
const RECENT = ["lisbon hotels", "kyoto in april", "cheap flights oct"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % (SEG * RUNS.length);
    const ri = Math.floor(lt / SEG), f = lt % SEG;
    const [query, pick] = RUNS[ri];
    const n = Math.max(0, Math.min(query.length, Math.floor((f - 0.6) / 0.45) + 1));
    const q = f < 0.6 ? "" : query.slice(0, n);
    const typedT = 0.6 + query.length * 0.45;
    const sel = f > typedT + 0.5 ? Math.min(pick, Math.floor((f - typedT - 0.5) / 0.6)) : -1;
    const chosen = f > typedT + 0.5 + pick * 0.6 + 0.7;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Explore ", "0");
    g.box(3, 2, W - 6, 3, "round", "3");
    g.text(5, 3, "○", "3");
    const shown = chosen ? DATA.filter((d) => d[0].toLowerCase().startsWith(query))[pick][0] : q;
    g.text(7, 3, shown || "Search destinations", shown ? "0" : "7");
    if (!chosen && Math.floor(lt * 3) % 2 === 0) g.set(7 + q.length, 3, "▏", "3");
    g.text(W - 12, 3, "Ctrl K", "7");
    if (chosen) {
      g.text(5, 6, "Loading results for " + shown + "...", "1");
      const bars = Math.min(4, Math.floor((f - (typedT + 0.5 + pick * 0.6 + 0.7)) * 4));
      for (let i = 0; i < bars; i++) {
        g.box(5, 8 + i * 3, W - 10, 3, "round", "8");
        g.text(7, 9 + i * 3, ["Hotels in ", "Things to do in ", "Flights to ", "Weather in "][i] + shown, i === 0 ? "0" : "1");
      }
      return g.frame();
    }
    let list;
    if (!q) {
      g.text(5, 6, "Recent searches", "6");
      RECENT.forEach((r, i) => { g.text(5, 7 + i, "◦", "7"); g.text(7, 7 + i, r, "1"); });
      g.text(5, 11, "Trending", "6");
      ["Northern lights trips", "Weekend city breaks"].forEach((r, i) => { g.text(5, 12 + i, "↗", "4"); g.text(7, 12 + i, r, "1"); });
      return g.frame();
    }
    list = DATA.filter((d) => d[0].toLowerCase().startsWith(q)).slice(0, 7);
    const lh = list.length + 2;
    g.box(3, 5, W - 6, lh + 1, "round", "8");
    g.text(5, 5, ` ${list.length} matches `, "1");
    list.forEach(([name, kind, c], i) => {
      const y = 6 + i, on = i === sel;
      if (on) { g.fill(4, y, W - 8, 1, "░", "8"); g.set(4, y, "▌", "3"); }
      g.text(6, y, "●", c);
      g.text(8, y, name.slice(0, q.length), "9");
      g.text(8 + q.length, y, name.slice(q.length), on ? "0" : "0");
      g.text(32, y, kind, on ? "1" : "7");
      if (on) g.text(W - 9, y, "◄", "3");
    });
    g.text(5, 6 + list.length + 1, "↑↓ navigate   enter select   esc close", "7");
    return g.frame();
  };
}
