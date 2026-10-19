/* sushi-conveyor: plates of nigiri and maki glide past on a steel conveyor belt below a swaying indigo curtain. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WOOD = add(gradient(["#2a1408", "#4a2a14", "#6e4424", "#966236", "#bc8650"], 6));
const NOREN = add(["#141e4a", "#22306e", "#3a4c9a", "#e8ecf4"]);
const STEEL = add(gradient(["#2a2e34", "#4e545e", "#7a828e", "#b0b8c4", "#e4eaf0"], 6));
const PLATES = add(["#1e5aa8", "#c82a2a", "#e8b030", "#2a9a5a", "#8a3aa8"]);
const PLATEW = add(["#c8ccd0", "#f4f6f8"]);
const RICE = add(["#d8d4c8", "#f4f2ea", "#ffffff"]);
const SALMON = add(["#e85a2a", "#ff8a4a", "#ffd0b0"]);
const TUNA = add(["#8a0e1e", "#c8203a", "#e8506a"]);
const EGG = add(["#e8b020", "#ffd84a"]);
const NORI = add(["#0a120c", "#1a2a1e"]);
const PRAWN = add(["#ff6a3a", "#fff0e0"]);
const CUC = add(["#3a9a3a", "#8ae06a"]);
const STEAM = add(["#7a6a5e", "#c4b8ae"]);

export const meta = {
  slug: "sushi-conveyor",
  name: "Sushi Conveyor Belt",
  category: "food",
  note: "Colour rimmed plates of salmon, tuna, egg and prawn nigiri and cucumber maki glide past on a steel belt below a swaying indigo curtain.",
  tags: ["sushi", "japanese", "restaurant", "conveyor", "food", "banner"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(P),
};

const SPACING = 17, KINDS = ["salmon", "maki", "tuna", "egg", "prawn", "maki", "salmon"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const L = SPACING * KINDS.length;
  const beltY = 20;
  return (t) => {
    const shift = t * 5;
    // wood slat wall
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const slat = x % 5 === 0;
      const v = clamp(0.3 + fbm(x * 0.4, y * 0.05, 2) * 0.4 - (slat ? 0.25 : 0) + Math.exp(-Math.hypot((x - 50) / 50, (y - 8) / 10)) * 0.25);
      g.set(x, y, slat ? "▒" : "█", KEYS[WOOD + Math.min(5, Math.floor(v * 6))]);
    }
    // noren curtain panels sway in a draught
    for (let pnl = 0; pnl < 5; pnl++) {
      const x0 = 4 + pnl * 19, sw = Math.sin(t * 1.3 + pnl * 0.9) * 1.2;
      for (let y = 0; y < 8; y++) {
        const off = Math.round(sw * (y / 8) ** 2);
        for (let x = 0; x < 17; x++) {
          const wave = y > 3 && Math.sin((x + pnl * 3) * 0.7 + y * 1.6) > 0.75;
          g.set(x0 + x + off, y, y === 0 ? "▀" : "█", KEYS[NOREN + (y === 0 ? 0 : wave ? 3 : y < 3 ? 1 : 2)]);
        }
      }
    }
    // back counter ledge
    for (let x = 0; x < cols; x++) { g.set(x, 11, "▄", KEYS[WOOD + 4]); g.set(x, 12, "█", KEYS[WOOD + 1]); }
    // belt: moving slats and a steel rail
    for (let y = beltY - 2; y <= beltY + 2; y++) for (let x = 0; x < cols; x++) {
      const seg = ((x - Math.floor(shift)) % 6 + 6) % 6 === 0;
      g.set(x, y, "█", KEYS[STEEL + (seg ? 1 : y === beltY - 2 ? 4 : 2 + (y < beltY ? 1 : 0))]);
    }
    for (let y = beltY + 3; y <= beltY + 4; y++) for (let x = 0; x < cols; x++) g.set(x, y, "█", KEYS[STEEL + (y === beltY + 3 ? 5 : 0)]);
    for (let y = 13; y < beltY - 2; y++) for (let x = 0; x < cols; x++) g.set(x, y, "█", KEYS[WOOD + (y === 13 ? 0 : 1)]);
    // plates with sushi riding the belt
    KINDS.forEach((kind, i) => {
      const px = Math.round(((i * SPACING + shift) % L) - 12);
      if (px < -14 || px > cols + 2) return;
      const pc = PLATES + (i % 5);
      // plate
      for (let y = beltY - 2; y <= beltY + 1; y++) for (let x = px - 7; x <= px + 7; x++) {
        const d = Math.hypot((x - px) / 7, (y - beltY + 0.5) / 1.7);
        if (d < 1) g.set(x, y, "█", KEYS[d > 0.75 ? pc : PLATEW + (x < px ? 1 : 0)]);
      }
      const set = (x, y, k) => g.set(x, y, "█", KEYS[k]);
      if (kind === "maki") {
        for (const mx of [px - 5, px - 1, px + 3]) for (let y = beltY - 5; y <= beltY - 2; y++) for (let x = mx; x < mx + 3; x++) {
          if (y === beltY - 5) set(x, y, x === mx + 1 ? CUC + 1 : RICE + 2);
          else set(x, y, NORI + (x === mx ? 1 : 0));
        }
        for (const mx of [px - 5, px - 1, px + 3]) { g.set(mx, beltY - 5, "█", KEYS[RICE + 1]); g.set(mx + 2, beltY - 5, "█", KEYS[RICE + 1]); }
      } else {
        for (const nx of [px - 5, px + 1]) {
          for (let y = beltY - 3; y <= beltY - 2; y++) for (let x = nx; x < nx + 5; x++) set(x, y, RICE + (x === nx ? 0 : 1));
          for (let x = nx - 1; x < nx + 6; x++) {
            const y = beltY - 4 - (x > nx && x < nx + 4 ? 1 : 0);
            let k;
            if (kind === "salmon") k = (x + i) % 3 === 0 ? SALMON + 2 : SALMON + (x < nx + 2 ? 1 : 0);
            else if (kind === "tuna") k = TUNA + (x < nx + 1 ? 2 : x < nx + 3 ? 1 : 0);
            else if (kind === "egg") k = x === nx + 2 ? NORI : EGG + (x < nx + 2 ? 1 : 0);
            else k = (x % 2 === 0) ? PRAWN : PRAWN + 1;
            set(x, y, k);
            if (y === beltY - 5) set(x, beltY - 4, kind === "egg" && x === nx + 2 ? NORI : k);
          }
          if (kind === "egg") { set(nx + 2, beltY - 3, NORI); set(nx + 2, beltY - 2, NORI); }
          if (kind === "prawn") set(nx + 6, beltY - 5, PRAWN);
        }
      }
    });
    // front counter with a tea cup and a soy dish
    for (let y = beltY + 5; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.45 + fbm(x * 0.03, y * 1.2, 2) * 0.45 - (y - beltY - 5) * 0.05);
      g.set(x, y, y === beltY + 5 ? "▀" : "█", KEYS[WOOD + Math.min(5, Math.floor(v * 6))]);
    }
    for (let y = rows - 4; y < rows - 1; y++) for (let x = 78; x < 85; x++) g.set(x, y, "█", KEYS[y === rows - 4 ? NOREN + 3 : NOREN + 1 + (x < 81 ? 1 : 0)]);
    for (let x = 64; x < 72; x++) g.set(x, rows - 2, "█", KEYS[x === 64 || x === 71 ? PLATEW : NORI + 1]);
    for (let k = 0; k < 5; k++) {
      const a = (t * 0.4 + k / 5) % 1;
      const x = 81 + Math.sin(a * 6 + k * 2) * 1.5, y = rows - 5 - a * 4;
      g.set(x, y, a < 0.5 ? "▒" : "░", KEYS[STEAM + (a < 0.5 ? 1 : 0)]);
    }
    return g.frame();
  };
}
