/* pour-over-drip: a gooseneck kettle spirals water onto a ceramic pour-over cone, coffee dripping into a glass carafe. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#16120e", "#2a221a", "#3e3226", "#564634", "#74604a"], 7));
const WOOD = add(gradient(["#2c160a", "#5a3218", "#8a5428", "#b47a40"], 5));
const CERAMIC = add(gradient(["#8a8680", "#c4c0b8", "#ece8e0", "#ffffff"], 6));
const KETTLE = add(gradient(["#1e1e24", "#3e3e48", "#6a6a76", "#9c9caa", "#d0d0da", "#ffffff"], 6));
const GLASS = add(["#4a5a62", "#7a929e", "#b4ccd6", "#e8f6fc"]);
const COFFEE = add(gradient(["#1a0a04", "#3a1a08", "#5e2e10", "#8a4c1e", "#c4823e", "#eab878"], 8));
const WATER = add(["#9ab4c0", "#d4ecf4", "#ffffff"]);
const COLLAR = add(["#4a2410", "#7a4420", "#a8642e"]);
const STEAM = add(gradient(["#5a6a64", "#9aa8a2", "#dce4e0", "#ffffff"], 5));

export const meta = {
  slug: "pour-over-drip",
  name: "Pour Over Drip",
  category: "food",
  note: "A gooseneck kettle spirals hot water over blooming grounds in a ceramic cone while coffee drips steadily into a glass carafe.",
  tags: ["coffee", "pour-over", "cafe", "morning", "loader", "wallpaper"],
  cols: 72, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 12;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 40, rimY = 13, tipY = 22, tableY = 34;
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const pouring = p < 8;
    const level = p < 11 ? 0.12 + 0.68 * smooth(p / 11) : 0.8 - 0.68 * smooth((p - 11));
    // wall with window light, wooden counter
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < tableY) {
        const light = Math.exp(-Math.hypot((x - 58) / 22, (y - 6) / 12));
        const v = clamp(0.15 + light * 0.6 + fbm(x * 0.07, y * 0.14, 3) * 0.3);
        g.set(x, y, v > 0.55 ? "▓" : v > 0.3 ? "▒" : "░", KEYS[WALL + Math.min(6, Math.floor(v * 7))]);
      } else {
        const v = clamp(0.3 + fbm(x * 0.04, y * 1.2, 2) * 0.6 - (y - tableY) * 0.05);
        g.set(x, y, y === tableY ? "▄" : "█", KEYS[WOOD + Math.min(4, Math.floor(v * 5))]);
      }
    }
    // steam above the coffee bed
    for (let k = 0; k < 3; k++) for (let y = 1; y < rimY - 1; y++) {
      const hgt = (rimY - 1 - y) / (rimY - 2);
      const xc = cx - 5 + k * 5 + Math.sin(y * 0.4 + t * 1.6 + k * 2) * (1 + hgt * 3) + (noise2(y * 0.2 + t * 0.5, k, 3) - 0.5) * 5 * hgt;
      for (let x = Math.floor(xc - 2); x <= xc + 2; x++) {
        const d = Math.exp(-(((x - xc) / (1 + hgt * 1.5)) ** 2)) * (1 - hgt) * (0.5 + 0.5 * noise2(x * 0.3, y * 0.6 + t * 2, k));
        if (d > 0.2) g.set(x, y, d > 0.5 ? "▒" : "░", KEYS[STEAM + Math.min(4, Math.floor(d * 6))]);
      }
    }
    // carafe: a glass bulb with a wooden collar
    const by = 29, brx = 14, bry = 5;
    const liqTop = Math.round(by + bry - level * (bry * 2 + 1));
    for (let y = 23; y < tableY; y++) for (let x = cx - brx - 1; x <= cx + brx + 1; x++) {
      let w;
      if (y < 25) w = 5; else { const dy = (y - by) / bry; w = brx * Math.sqrt(Math.max(0, 1 - Math.min(1, dy * dy) * (dy < 0 ? 0.75 : 0.55))); }
      const dx = x - cx;
      if (Math.abs(dx) > w) continue;
      const rim = Math.abs(dx) > w - 1.2;
      if (y >= liqTop && !rim) {
        const u = dx / w;
        let v = clamp(0.25 + (1 - Math.abs(u)) * 0.25 - u * 0.15 + (y === liqTop ? 0.45 : 0));
        if (Math.abs(u + 0.6) < 0.08) v = 0.8;
        g.set(x, y, "█", KEYS[COFFEE + Math.min(7, Math.floor(v * 8))]);
      } else if (rim) g.set(x, y, "█", KEYS[GLASS + (dx < 0 ? 2 : 1)]);
      else g.set(x, y, Math.abs(dx + w * 0.55) < 0.8 ? "▒" : "░", KEYS[GLASS + (Math.abs(dx + w * 0.55) < 0.8 ? 3 : 0)]);
    }
    for (let x = cx - 6; x <= cx + 6; x++) for (let y = 23; y <= 24; y++) g.set(x, y, "█", KEYS[COLLAR + ((x + y) % 3 === 0 ? 2 : y === 23 ? 1 : 0)]);
    // drips from the cone tip into the carafe
    if (pouring || p < 9.5) {
      const steady = pouring && p > 1;
      for (let y = tipY + 1; y < liqTop; y++) {
        if (steady) g.set(cx, y, (y + Math.floor(t * 20)) % 4 === 0 ? "•" : "│", KEYS[COFFEE + 4]);
        else if ((y + Math.floor(t * 14)) % 5 === 0) g.set(cx, y, "•", KEYS[COFFEE + 4]);
      }
      for (let k = -1; k <= 1; k++) if (Math.sin(t * 9 + k * 2) > 0.3) g.set(cx + k * 2, liqTop - 1, "°", KEYS[COFFEE + 6]);
    }
    // ceramic cone with a paper filter edge
    for (let y = rimY; y <= tipY; y++) {
      const f = (y - rimY) / (tipY - rimY);
      const w = 13 - f * 9.5;
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const u = (x - cx) / w;
        if (Math.abs(u) > 1) continue;
        let v = clamp(Math.sqrt(1 - u * u) * 0.6 + 0.3 - u * 0.25 - f * 0.1);
        if (y % 3 === 1 && Math.abs(u) < 0.85) v -= 0.12;
        g.set(x, y, "█", KEYS[CERAMIC + Math.min(5, Math.max(0, Math.floor(v * 6)))]);
      }
    }
    for (let x = cx - 2; x <= cx + 2; x++) g.set(x, tipY, "█", KEYS[CERAMIC + 1]);
    for (let x = cx - 15; x <= cx + 15; x++) g.set(x, rimY - 1, "▄", KEYS[CERAMIC + 4]);
    // the bed of grounds, blooming where the water lands
    const sx = cx + Math.cos(t * 2.2) * 7, bloom = pouring ? smooth(clamp(p / 2)) : 1 - smooth(clamp((p - 8) / 3));
    for (let y = rimY - 3; y <= rimY - 1; y++) for (let x = cx - 13; x <= cx + 13; x++) {
      const e = ((x - cx) / 13) ** 2 + ((y - rimY + 1.5) / 1.6) ** 2;
      const dome = bloom * 0.6 * Math.exp(-(((x - cx) / 9) ** 2));
      if (e > 1 + dome || (y === rimY - 3 && e > 0.5 + dome)) continue;
      const near = Math.exp(-(((x - sx) / 3) ** 2));
      const bub = noise2(x * 0.8 + t * 1.5, y * 2 - t * 0.8, 5) > 0.68 && pouring;
      const v = clamp(0.35 + fbm(x * 0.3, y, 2) * 0.3 + near * 0.35 * bloom);
      g.set(x, y, "█", KEYS[COFFEE + (bub ? 7 : Math.min(6, Math.floor(v * 7)))]);
    }
    // gooseneck kettle
    for (let y = 3; y <= 14; y++) for (let x = 1; x <= 25; x++) {
      const d = Math.hypot((x - 13) / 11.5, (y - 9.5) / 5.2);
      if (d > 1 || y < 4) continue;
      let v = clamp(0.62 - (x - 13) * 0.035 - (y - 7) * 0.05);
      if (Math.abs(x - 8) < 1.2 && y > 5 && y < 13) v = 1;
      g.set(x, y, "█", KEYS[KETTLE + Math.min(5, Math.floor(v * 6))]);
    }
    g.text(6, 3, "▄▄▄▄▄▄▄▄▄▄▄▄▄▄", KEYS[KETTLE + 3]);
    g.text(11, 2, "▄██▄", KEYS[KETTLE + 1]);
    for (let y = 5; y <= 12; y++) g.set(0, y, "█", KEYS[KETTLE + 1]);
    g.set(1, 4, "▄", KEYS[KETTLE + 1]); g.set(1, 13, "▀", KEYS[KETTLE + 1]);
    // spout: up from the base then out over the cone
    const tilt = pouring ? 1 : 0;
    const spout = [[23, 13], [26, 11], [28, 8], [30, 6], [33, 5], [35, 5 + tilt]];
    for (let i = 0; i < spout.length - 1; i++) {
      g.line(spout[i][0], spout[i][1], spout[i + 1][0], spout[i + 1][1], "█", KEYS[KETTLE + 2]);
      g.line(spout[i][0], spout[i][1] - 1, spout[i + 1][0], spout[i + 1][1] - 1, "▄", KEYS[KETTLE + 4]);
    }
    // water stream arcing to the moving pour point
    if (pouring && p > 0.3) {
      const [tx, ty] = spout[spout.length - 1];
      const ex = sx, ey = rimY - 2;
      for (let i = 1; i <= 24; i++) {
        const f = i / 24;
        const x = tx + (ex - tx) * f + Math.sin(f * Math.PI) * 1.2, y = ty + (ey - ty) * f * f * 0.3 + (ey - ty) * f * 0.7;
        g.set(Math.round(x), Math.round(y), f < 0.5 ? "█" : "▓", KEYS[WATER + (Math.sin(f * 20 - t * 30) > 0.5 ? 2 : 1)]);
      }
    }
    return g.frame();
  };
}
