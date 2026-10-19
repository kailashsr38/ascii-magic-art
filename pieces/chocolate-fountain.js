/* chocolate-fountain: a three tier fountain with sheets of melted chocolate cascading down, a strawberry on a skewer dipped in and pulled out coated. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#140806", "#24100a", "#38180e", "#4e2414"], 5));
const CHOC = add(gradient(["#1e0a04", "#3a1608", "#5a260e", "#7e3a18", "#a85a2a", "#d08a50"], 8));
const STEEL = add(gradient(["#3a3e44", "#6a7078", "#a0a8b2", "#d8dee6", "#ffffff"], 6));
const BERRY = add(["#7a0a14", "#d0202e", "#ff5a5a", "#3a7a1a", "#fff0c0"]);
const STICK = add(["#a8865a", "#e0c08a"]);
const CLOTH = add(gradient(["#3a0a14", "#5a1420", "#7a1e2c"], 3));

export const meta = {
  slug: "chocolate-fountain",
  name: "Chocolate Fountain",
  category: "food",
  note: "Sheets of melted chocolate cascade down a three tier steel fountain into a swirling basin while a strawberry on a skewer is dipped in and pulled out coated.",
  tags: ["chocolate", "dessert", "party", "fondue", "food", "wallpaper"],
  cols: 66, rows: 40, fps: 24,
  palette: palette(P),
};

const PER = 7;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 30;
  const tiers = [{ y: 9, r: 6 }, { y: 17, r: 11 }, { y: 25, r: 16 }];
  const basin = { y: 33, r: 24 };
  const sheet = (x, y, t) => {
    const s = Math.sin(x * 1.1 + Math.sin(x * 0.37) * 2) * 0.5 + Math.sin((y - t * 11) * 0.7 + x * 1.9) * 0.5;
    return CHOC + Math.min(7, Math.max(0, Math.floor(3 + s * 3)));
  };
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    // warm dim room, tablecloth
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < 34) {
        const v = clamp(0.2 + Math.exp(-Math.hypot((x - cx) / 28, (y - 18) / 18)) * 0.6 + fbm(x * 0.07, y * 0.12, 2) * 0.15);
        g.set(x, y, v > 0.55 ? "▓" : "▒", KEYS[BG + Math.min(4, Math.floor(v * 5))]);
      } else g.set(x, y, "█", KEYS[CLOTH + ((x + y) % 4 === 0 ? 0 : y === 34 ? 2 : 1)]);
    }
    // basin with a swirling pool
    for (let y = basin.y - 3; y <= basin.y + 3; y++) for (let x = cx - basin.r; x <= cx + basin.r; x++) {
      const nx = (x - cx) / basin.r, ny = (y - basin.y) / 3;
      const e = nx * nx + ny * ny;
      if (e > 1) continue;
      if (e > 0.8 || y > basin.y + 1) { g.set(x, y, "█", KEYS[STEEL + (x < cx ? 3 : 2)]); continue; }
      const sw = Math.sin(Math.atan2(ny, nx) * 3 - t * 2 + Math.sqrt(e) * 6);
      g.set(x, y, "█", KEYS[CHOC + (sw > 0.6 ? 5 : sw > 0 ? 3 : 2)]);
    }
    for (let y = basin.y + 4; y <= basin.y + 5; y++) for (let x = cx - 7; x <= cx + 7; x++) g.set(x, y, "█", KEYS[STEEL + (x < cx ? 3 : 1)]);
    // central column
    for (let y = 2; y < basin.y - 2; y++) for (let x = cx - 1; x <= cx + 1; x++) g.set(x, y, "█", KEYS[STEEL + (x === cx - 1 ? 4 : x === cx ? 2 : 1)]);
    // tiers and falling sheets beneath them
    tiers.forEach((tr, i) => {
      const next = i < 2 ? tiers[i + 1].y - 1 : basin.y - 2;
      for (let y = tr.y + 1; y <= next; y++) {
        const w = tr.r + 1 + (y - tr.y) * 0.35;
        for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
          const u = (x - cx) / w;
          if (Math.abs(u) > 1) continue;
          const k = sheet(x, y, t);
          g.set(x, y, "█", KEYS[Math.abs(u) > 0.92 ? CHOC + 1 : k]);
        }
      }
      // the tier dish, chocolate brimming over its lip
      for (let y = tr.y - 1; y <= tr.y; y++) for (let x = cx - tr.r - 1; x <= cx + tr.r + 1; x++) {
        const u = (x - cx) / (tr.r + 1);
        g.set(x, y, "█", KEYS[y === tr.y ? STEEL + (u < 0 ? 4 : 2) : CHOC + (Math.sin(x * 0.8 - t * 3) > 0.3 ? 5 : 4)]);
      }
    });
    // crown at the top, chocolate welling out
    for (let y = 2; y <= 7; y++) {
      const w = y < 4 ? 2 : 3 + (y - 4) * 0.4;
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) g.set(x, y, "█", KEYS[y < 4 ? CHOC + 5 : sheet(x, y, t)]);
    }
    g.set(cx, 1, "▄", KEYS[CHOC + 6]);
    // strawberry on a skewer: dipped into the lower curtain and pulled back out coated
    const dip = smooth(clamp(p / 1.6)) * (1 - smooth(clamp((p - 3.2) / 1.6)));
    const coated = p > 2.2;
    const drip = coated ? clamp((p - 3.2) / 3.8) : 0;
    const bx = Math.round(lerp(cols + 4, cx + 15, dip)), by = 21 + Math.round(Math.sin(p * 1.4) * 0.6);
    g.line(bx + 3, by, cols, by - 6, "█", KEYS[STICK]);
    for (let y = by - 2; y <= by + 2; y++) for (let x = bx - 4; x <= bx + 4; x++) {
      const d = Math.hypot((x - bx) / 4.2, (y - by) / 2.4) + Math.max(0, (bx - x) / 4.2) * 0.3;
      if (d > 1) continue;
      const left = x < bx + 1 - 0;
      if (coated && left) g.set(x, y, "█", KEYS[CHOC + (y < by ? 5 : 3)]);
      else g.set(x, y, "█", KEYS[(x + y) % 3 === 0 ? BERRY + 4 : BERRY + (y < by ? 2 : 1)]);
    }
    g.text(bx + 3, by - 2, "▄▄", KEYS[BERRY + 3]);
    if (coated && dip < 0.6) for (let k = 0; k < 2; k++) {
      const a = (drip * 3 + k * 0.5) % 1;
      g.set(bx - 2 + k * 2, by + 3 + Math.floor(a * 8), "•", KEYS[CHOC + 4]);
    }
    return g.frame();
  };
}
