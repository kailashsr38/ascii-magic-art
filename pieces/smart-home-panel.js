/* smart-home-panel: a smart home dashboard with rooms, lights switching, a thermostat moving and a live energy graph. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "smart-home-panel",
  name: "Smart Home Panel",
  category: "screens",
  note: "A home dashboard where lights flip on room by room, the thermostat climbs to its target, the door locks and the energy graph scrolls.",
  tags: ["smart-home", "dashboard", "iot", "app", "controls"],
  cols: 92, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const ROOMS = [["Lounge", [1.0, 9.0]], ["Kitchen", [2.2, 7.5]], ["Bedroom", [3.4, 11.0]], ["Office", [4.6, 10.0]], ["Hallway", [5.8, 8.2]], ["Garden", [7.0, 12.0]]];
const PERIOD = 14;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Home ", "0");
    g.text(W - 30, 0, " Evening scene · 19:4" + Math.floor(lt / 2) % 10 + " ", "6");
    // room tiles 3x2
    let on = 0;
    ROOMS.forEach(([name, [a, b]], i) => {
      const lit = lt >= a && lt < b;
      if (lit) on++;
      const x = 2 + (i % 3) * 19, y = 2 + Math.floor(i / 3) * 6;
      g.box(x, y, 18, 5, "round", lit ? "9" : "8");
      g.text(x + 2, y + 1, name, lit ? "0" : "1");
      const bulb = lit ? ["  .  ", " (█) ", "  ▀  "] : ["     ", " (·) ", "  ▀  "];
      bulb.forEach((r, k) => g.text(x + 12, y + 1 + k, r.slice(0, 5), lit ? "9" : "7"));
      g.text(x + 2, y + 2, lit ? Math.round(60 + 30 * Math.sin(i)) + "%" : "Off", lit ? "9" : "7");
      const sw = lit ? "━━●" : "●──";
      g.text(x + 2, y + 3, sw, lit ? "2" : "7");
    });
    // thermostat
    const tx = 61;
    g.box(tx, 2, W - tx - 2, 11, "round", "8");
    g.text(tx + 2, 3, "Thermostat", "1");
    const cur = 19.0 + Math.min(2.5, Math.max(0, lt - 1.5) * 0.3);
    const tgt = 21.5;
    const arc = 20, ax = tx + 4, ay = 8;
    for (let k = 0; k < arc; k++) {
      const v = k / (arc - 1);
      const filled = v <= (cur - 15) / 10;
      g.set(ax + k, ay + 2, "▀", filled ? (v > 0.6 ? "4" : "3") : "8");
    }
    g.set(ax + Math.round(((tgt - 15) / 10) * (arc - 1)), ay + 3, "▲", "0");
    g.text(tx + 6, 5, cur.toFixed(1) + "°C", "0");
    g.text(tx + 2, 7, cur < tgt - 0.05 ? "Heating to " + tgt + "°" : "Holding " + tgt + "°", cur < tgt - 0.05 ? "4" : "2");
    g.text(tx + 2, 11, "15°", "7"); g.text(tx + 21, 11, "25°", "7");
    // locks and devices
    const lockT = 6.5;
    const locked = lt >= lockT;
    const devs = [["Front door", locked ? "Locked" : "Unlocked", locked ? "2" : "4"], ["Garage", "Closed", "2"], ["Robot vacuum", lt < 9 ? "Cleaning " + Math.min(100, Math.round(lt * 11)) + "%" : "Docked", lt < 9 ? "3" : "1"], ["Washer", "12 min left", "6"]];
    g.hline(1, W - 2, 14, "─", "8");
    devs.forEach(([n, s, c], i) => {
      const x = 2 + i * 22;
      g.text(x, 15, n, "1");
      g.text(x, 16, (i === 0 ? (locked ? "■ " : "□ ") : "● ") + s, c);
    });
    // energy graph
    g.hline(1, W - 2, 18, "─", "8");
    g.text(2, 18, " Power now ", "1");
    const kw = 0.4 + on * 0.12 + (cur < tgt ? 1.1 : 0.2);
    g.text(14, 18, " " + kw.toFixed(2) + " kW ", "9");
    g.text(W - 31, 18, " today 11.4 kWh · solar 3.1 ", "2");
    const gw = W - 4;
    for (let k = 0; k < gw; k++) {
      const tt = t - (gw - k) * 0.12;
      const v = 0.35 + 0.25 * Math.sin(tt * 0.6) + 0.15 * Math.sin(tt * 2.1 + 1) + 0.1 * Math.sin(tt * 5.3);
      const h = Math.max(1, Math.round(v * 10));
      for (let r = 0; r < h; r++) {
        const yy = H - 2 - Math.floor(r / 2);
        g.set(2 + k, yy, r % 2 === 0 ? (r + 1 === h ? "▄" : "█") : "█", v > 0.75 ? "4" : "3");
      }
    }
    return g.frame();
  };
}
