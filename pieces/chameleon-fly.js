/* chameleon-fly: a chameleon on a branch tracks a buzzing fly with its turret eye, then snaps it up with its tongue. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const JUNG = add(gradient(["#04140c", "#0a2414", "#123a1e", "#1e5228", "#2e6a32", "#467e3a"], 12));
const LEAF = add(gradient(["#0e3a14", "#1a5a1e", "#2e7e2a", "#4ea23a"], 6));
const BARK = add(gradient(["#2a1608", "#4a2a12", "#6e4420", "#8e5e30"], 6));
const SKIN = add(gradient(["#0e4a1a", "#1a7a2a", "#34a83a", "#6ad04a", "#b4f06a"], 10));
const STRIPE = add(["#d4c83a", "#f4e86a", "#2a8a8a"]);
const EYE = add(["#f4d23a", "#0a0a0a", "#ffffff"]);
const TONGUE = add(["#e85a7a", "#ff9ab0"]);
const FLY = add(["#2a2a30", "#5a5a64", "#c8e4ff", "#8ab0d0"]);

export const meta = {
  slug: "chameleon-fly",
  name: "Chameleon and the Fly",
  category: "animals",
  note: "A green chameleon grips a jungle branch, swivels its turret eye after a buzzing fly and catches it with one lightning flick of its tongue.",
  tags: ["chameleon", "lizard", "jungle", "insect", "animals", "funny"],
  cols: 90, rows: 30, fps: 30,
  palette: palette(P),
};

const PER = 8;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = fbm(x * 0.05, y * 0.1, 4, 6);
    const leaf = noise2(x * 0.18, y * 0.36, 12);
    const v = clamp(0.1 + n * 0.8 + (leaf > 0.7 ? 0.25 : 0));
    bg.push([leaf > 0.7 ? "▓" : v > 0.5 ? "▒" : "░", KEYS[JUNG + Math.min(11, Math.floor(v * 12))]]);
  }
  const branchY = (x) => 21 + (x - 45) * -0.06 + Math.sin(x * 0.15) * 0.4;
  const ell = (cx, cy, rx, ry, fn) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) fn(x, y, dx, dy);
    }
  };
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const breathe = Math.sin(t * 1.4) * 0.15;
    // a hanging leaf cluster on the right swaying
    for (let k = 0; k < 5; k++) {
      const lx = 78 + k * 3 + Math.sin(t * 0.8 + k) * 1.2, ly = 3 + k * 2.2;
      ell(lx, ly, 5, 1.6, (x, y, dx, dy) => g.set(x, y, Math.abs(dy) < 0.2 ? "▒" : "█", KEYS[LEAF + Math.min(5, Math.floor(clamp(0.6 - dy * 0.4 + dx * 0.2) * 6))]));
    }
    // branch
    for (let x = 0; x < cols; x++) {
      const by = branchY(x);
      for (let j = -1; j <= 1; j++) {
        const n = noise2(x * 0.3, j, 3);
        g.set(x, by + j, j === -1 ? "▄" : n > 0.6 ? "▓" : "█", KEYS[BARK + (j === -1 ? 4 : j === 0 ? 3 + (n > 0.5 ? 1 : 0) : 1)]);
      }
      if (x % 11 === 4) g.set(x, by + 2, "▀", KEYS[BARK]);
    }
    // fly path and catch timeline
    const p = ((t % PER) + PER) % PER;
    let fx = 70 + Math.sin(t * 1.9) * 8 + Math.sin(t * 4.3) * 2, fy = 9 + Math.sin(t * 3.8) * 3 + Math.cos(t * 1.3) * 2;
    if (p > 6.6) { const u = (p - 6.6) / 1.4; fx = cols + 2 - u * (cols + 2 - fx); fy = fy - (1 - u) * 4; }
    const mx = 59, my = 15.8;
    let tongue = 0, flyOn = p < 5.25 || p > 6.6;
    if (p >= 5 && p < 5.25) tongue = smooth((p - 5) / 0.25);
    else if (p >= 5.25 && p < 5.6) tongue = 1 - smooth((p - 5.25) / 0.35);
    const tx = mx + (fx - mx) * tongue, ty = my + (fy - my) * tongue;
    // tail spiral under the branch
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const a = u * TAU * 1.6;
      const r = 6 * (1 - u * 0.85);
      const x = 22 - Math.sin(a) * r * 1.6 - u * 2, y = 21.5 + (1 - Math.cos(a)) * r * 0.55 - u * 0.5;
      const th = 1.6 * (1 - u * 0.7);
      for (let k = -th; k <= th; k += 0.6) g.set(x + k * 0.5, y + k * 0.5, "█", KEYS[SKIN + Math.min(9, Math.floor(clamp(0.6 - k * 0.2) * 8) - (Math.floor(u * 14) % 2 ? 1 : 0))]);
    }
    // legs gripping
    for (const [lx, sw] of [[27, 0.3], [33, -0.2], [43, 0.2], [48, -0.3]]) {
      const by = branchY(lx);
      g.line(lx, 18.5, lx + sw * 3, by - 1, "█", KEYS[SKIN + 2]);
      g.text(lx + sw * 3 - 1, by - 1, "▄█▄", KEYS[SKIN + 1]);
    }
    // body
    const bx = 36, byy = 15.5 + breathe;
    ell(bx, byy, 13, 4.2 + breathe, (x, y, dx, dy) => {
      const dd = dx * dx + dy * dy;
      const stripe = Math.sin(x * 0.6) > 0.75 && dy > -0.5 && dd < 0.8;
      const dots = noise2(x * 0.9, y * 1.6, 7) > 0.74;
      const v = clamp(0.55 - dy * 0.3);
      g.set(x, y, dots ? "▓" : "█", dd > 0.78 ? KEYS[SKIN + 1] : stripe ? KEYS[STRIPE + (dy < 0 ? 1 : 0)] : KEYS[SKIN + Math.min(9, Math.floor(v * 10) - (dots ? 2 : 0))]);
    });
    for (let x = bx - 11; x <= bx + 10; x += 2) g.set(x, byy - 4.2 - breathe - Math.sin((x - bx + 11) / 21 * Math.PI) * 0.5, "▲", KEYS[SKIN + 1]);
    // head: casque on top, long jaw toward the snout
    for (let x = 46; x <= 60; x++) {
      const u = (x - 46) / 14;
      const top = 10.5 + u * 4.6 - Math.sin(u * Math.PI) * 0.4, bot = 18.5 - u * 2.8;
      for (let y = Math.floor(top); y <= bot; y++) {
        const edge = y === Math.floor(top) || y >= Math.floor(bot);
        const jaw = y > bot - 1.6;
        g.set(x, y, "█", KEYS[edge ? SKIN + 1 : jaw ? SKIN + 7 : SKIN + 5 + Math.floor((1 - u) * 2)]);
      }
    }
    g.line(50, 16.8, 60, 15.6, "▀", KEYS[SKIN]);
    // turret eye follows the fly
    const ex = 53, ey = 13.6;
    ell(ex, ey, 3, 1.9, (x, y, dx, dy) => g.set(x, y, dx * dx + dy * dy > 0.55 ? "▓" : "█", KEYS[dx * dx + dy * dy > 0.55 ? SKIN + 2 : SKIN + 9]));
    const ang = Math.atan2((fy - ey) * 2, fx - ex);
    g.set(ex + Math.cos(ang) * 1.2, ey + Math.sin(ang) * 0.6, "●", KEYS[EYE + 1]);
    g.set(ex + Math.cos(ang) * 1.2 - 1, ey + Math.sin(ang) * 0.6, "▐", KEYS[EYE]);
    // tongue
    if (tongue > 0) {
      g.line(mx, my, tx, ty, "━", KEYS[TONGUE]);
      g.text(Math.round(tx) - 1, Math.round(ty), "█●", KEYS[TONGUE + 1]);
    }
    if (p >= 5.6 && p < 6.6) g.set(mx - 1, my + (Math.floor(p * 8) % 2 ? 0.6 : 0), "▄", KEYS[SKIN]);
    // the fly
    if (flyOn || tongue > 0) {
      const x = tongue > 0 && p >= 5.25 ? tx : fx, y = tongue > 0 && p >= 5.25 ? ty : fy;
      const w = Math.floor(t * 30) % 2;
      g.set(x, y, "●", KEYS[FLY]);
      g.set(x + 1, y, "▪", KEYS[FLY + 1]);
      g.text(x - 2, y - 1, w ? "\\\\ //" : "== ==", KEYS[FLY + 2]);
      if (flyOn && tongue === 0) for (let k = 1; k <= 3; k++) g.set(x - Math.cos(t * 1.9) * k * 1.5, y - Math.cos(t * 3.8) * k * 0.4, "·", KEYS[FLY + 3]);
    }
    return g.frame();
  };
}
