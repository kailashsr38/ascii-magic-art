/* rock-blaster: a little ship in deep space that turns, thrusts and blasts drifting rocks into smaller rocks. */
import { Grid, palette, gradient, KEYS, rng, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SPACE = add(gradient(["#04040c", "#0a0a1e", "#140f30", "#1e1440"], 5));
const STAR = add(["#4a4a6a", "#8a8ab0", "#e0e0ff"]);
const ROCK = add(gradient(["#2a2420", "#4a3e34", "#6e5c4a", "#9a8268", "#c8b090"], 8));
const SHIP = add(["#5af0ff", "#e8ffff", "#1a8aa8"]);
const FIRE = add(["#ff4a1a", "#ffa83a", "#fff07a", "#ffffff"]);
const SHOT = add(["#fff07a", "#ffb43a"]);
const UI = add(["#e6edf3", "#8b949e", "#5af0ff", "#ffd166"]);

export const meta = {
  slug: "rock-blaster",
  name: "Rock Blaster",
  category: "arcade",
  note: "A small arrow ship in deep space turns, thrusts and fires on its own, splitting tumbling space rocks into smaller and smaller pieces.",
  tags: ["space", "shooter", "game", "arcade", "retro", "asteroids"],
  cols: 84, rows: 32, fps: 30,
  palette: palette(P),
};

const RATE = 30, DT = 1 / RATE, WW = 84, WH = 64;
const RAD = [0, 2.6, 4.6, 7.6];
const wrap = (v, n) => ((v % n) + n) % n;
const wd = (a, n) => { a = wrap(a + n / 2, n) - n / 2; return a; };

function makeSim(rate, roundSteps, init, step) {
  let st = null, round = -1, k = 0;
  return (t) => {
    const s = Math.max(0, Math.floor(t * rate));
    const r = Math.floor(s / roundSteps), want = s % roundSteps;
    if (r !== round || want < k) { st = init(r); round = r; k = 0; }
    while (k < want) { step(st); k++; }
    return st;
  };
}
function rock(st, x, y, size) {
  const a = st.r() * TAU, sp = (6 + st.r() * 6) * (4 - size) * 0.6;
  st.rocks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size, rot: st.r() * TAU, vr: (st.r() - 0.5) * 1.5, seed: Math.floor(st.r() * 1000) });
}
function wave(st) {
  st.wave++;
  for (let i = 0; i < 4 + st.wave; i++) {
    const a = st.r() * TAU;
    rock(st, wrap(st.ship.x + Math.cos(a) * 30, WW), wrap(st.ship.y + Math.sin(a) * 24, WH), 3);
  }
}
function step(st) {
  st.tick++;
  const s = st.ship;
  for (const r of st.rocks) { r.x = wrap(r.x + r.vx * DT, WW); r.y = wrap(r.y + r.vy * DT, WH); r.rot += r.vr * DT; }
  for (const b of st.shots) { b.x = wrap(b.x + b.vx * DT, WW); b.y = wrap(b.y + b.vy * DT, WH); b.life--; }
  for (const p of st.parts) { p.x += p.vx * DT; p.y += p.vy * DT; p.life--; }
  st.parts = st.parts.filter((p) => p.life > 0);
  if (s.dead) { if (++s.dead > 45) { s.dead = 0; s.x = WW / 2; s.y = WH / 2; s.vx = s.vy = 0; s.inv = 60; } }
  else {
    if (s.inv) s.inv--;
    // aim at the nearest rock with a little lead
    let tgt = null, bd = 1e9, near = 1e9, nx = 0, ny = 0;
    for (const r of st.rocks) {
      const dx = wd(r.x - s.x, WW), dy = wd(r.y - s.y, WH), d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; tgt = r; }
      if (d - RAD[r.size] < near) { near = d - RAD[r.size]; nx = dx; ny = dy; }
    }
    s.thrust = false;
    if (tgt) {
      const dx = wd(tgt.x - s.x, WW), dy = wd(tgt.y - s.y, WH);
      const tt = bd / 40;
      const want = Math.atan2(dy + tgt.vy * tt, dx + tgt.vx * tt);
      let da = want - s.a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      s.a += clamp(da, -4.5 * DT, 4.5 * DT);
      if (Math.abs(da) < 0.12 && s.cd <= 0 && st.shots.length < 3) {
        st.shots.push({ x: s.x + Math.cos(s.a) * 3, y: s.y + Math.sin(s.a) * 3, vx: Math.cos(s.a) * 42 + s.vx, vy: Math.sin(s.a) * 42 + s.vy, life: 26 });
        s.cd = 14;
      }
      if (bd > 28 && Math.abs(da) < 0.5) s.thrust = true;
    }
    if (near < 7) { const l = Math.hypot(nx, ny) || 1; s.vx -= (nx / l) * 30 * DT; s.vy -= (ny / l) * 30 * DT; s.thrust = true; }
    if (s.thrust) { s.vx += Math.cos(s.a) * 22 * DT; s.vy += Math.sin(s.a) * 22 * DT; }
    s.vx *= 0.985; s.vy *= 0.985;
    s.x = wrap(s.x + s.vx * DT, WW); s.y = wrap(s.y + s.vy * DT, WH);
    s.cd--;
    if (!s.inv) for (const r of st.rocks) if (Math.hypot(wd(r.x - s.x, WW), wd(r.y - s.y, WH)) < RAD[r.size] + 1.2) {
      s.dead = 1; st.lives--;
      for (let i = 0; i < 24; i++) { const a = st.r() * TAU, v = 5 + st.r() * 20; st.parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 20 + Math.floor(st.r() * 20), ship: 1 }); }
      if (st.lives <= 0) { st.lives = 3; st.score = 0; }
      break;
    }
  }
  const keep = [];
  for (const b of st.shots) {
    if (b.life <= 0) continue;
    let hit = null;
    for (const r of st.rocks) if (Math.hypot(wd(r.x - b.x, WW), wd(r.y - b.y, WH)) < RAD[r.size] + 0.5) { hit = r; break; }
    if (!hit) { keep.push(b); continue; }
    st.rocks.splice(st.rocks.indexOf(hit), 1);
    st.score += [0, 100, 50, 20][hit.size];
    for (let i = 0; i < 6 + hit.size * 4; i++) { const a = st.r() * TAU, v = 4 + st.r() * 16; st.parts.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 10 + Math.floor(st.r() * 14) }); }
    if (hit.size > 1) { rock(st, hit.x, hit.y, hit.size - 1); rock(st, hit.x, hit.y, hit.size - 1); }
  }
  st.shots = keep;
  if (!st.rocks.length) { if (++st.clear > 40) { st.clear = 0; wave(st); } }
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  const sr = rng(12);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = fbm(x * 0.05, y * 0.11, 4, 3);
    const v = clamp((n - 0.35) * 2);
    const star = sr() < 0.03;
    bg.push(star ? [sr() < 0.3 ? "+" : "·", KEYS[STAR + (sr() < 0.3 ? 2 : sr() < 0.5 ? 1 : 0)]] : [v > 0.5 ? "▒" : "░", KEYS[SPACE + Math.min(4, Math.floor(v * 5))]]);
  }
  const sim = makeSim(RATE, RATE * 75, (round) => {
    const st = { r: rng(55 + round * 3), rocks: [], shots: [], parts: [], score: 0, lives: 3, wave: 0, tick: 0, clear: 0, ship: { x: WW / 2, y: WH / 2, vx: 0, vy: 0, a: -Math.PI / 2, cd: 0, dead: 0, inv: 30 } };
    wave(st); return st;
  }, step);
  const SY = (y) => y / 2;
  return (t) => {
    const st = sim(t);
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    for (const r of st.rocks) {
      const R = RAD[r.size];
      for (let dy = -R - 1; dy <= R + 1; dy += 2) for (let dx = -R - 1; dx <= R + 1; dx++) {
        const d = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx);
        const rr = R * (0.78 + 0.32 * noise2(Math.cos(a - r.rot) * 1.6 + r.seed, Math.sin(a - r.rot) * 1.6, 5));
        if (d > rr) continue;
        const lit = clamp(0.55 - (dx + dy) / (R * 2.4) + (noise2((dx * Math.cos(r.rot) - dy * Math.sin(r.rot)) * 0.6 + r.seed, (dx * Math.sin(r.rot) + dy * Math.cos(r.rot)) * 0.6, 8) - 0.5) * 0.5);
        const edge = d > rr - 1.1;
        const crater = noise2((dx * Math.cos(r.rot) - dy * Math.sin(r.rot)) * 0.35 + r.seed * 3, (dx * Math.sin(r.rot) + dy * Math.cos(r.rot)) * 0.35, 11) > 0.68;
        const x = Math.floor(wrap(r.x + dx, WW)), y = Math.floor(SY(wrap(r.y + dy, WH)));
        g.set(x, y, edge ? "▓" : crater ? "▒" : "█", KEYS[ROCK + Math.max(0, Math.min(7, Math.floor(lit * 8) - (crater ? 3 : 0)))]);
      }
    }
    for (const b of st.shots) {
      g.set(b.x, SY(b.y), "●", KEYS[SHOT]);
      g.set(wrap(b.x - b.vx * 0.03, WW), SY(wrap(b.y - b.vy * 0.03, WH)), "·", KEYS[SHOT + 1]);
    }
    for (const p of st.parts) g.set(wrap(p.x, WW), SY(wrap(p.y, WH)), p.life > 14 ? "*" : p.life > 7 ? "+" : "·", KEYS[(p.ship ? SHIP : FIRE) + (p.life > 14 ? 2 : p.life > 7 ? 1 : 0)]);
    const s = st.ship;
    if (!s.dead && !(s.inv && Math.floor(st.tick / 3) % 2)) {
      const c = Math.cos(s.a), sn = Math.sin(s.a);
      const pt = (fx, fy) => [wrap(s.x + c * fx - sn * fy, WW), SY(wrap(s.y + sn * fx + c * fy, WH))];
      const nose = pt(4.6, 0), l = pt(-2.8, -3.2), r = pt(-2.8, 3.2), m = pt(-1.4, 0);
      if (s.thrust) { const f = pt(-3.4 - (st.tick % 3), 0); g.line(m[0], m[1], f[0], f[1], "▒", KEYS[FIRE + (st.tick % 2)]); g.set(f[0], f[1], "░", KEYS[FIRE]); }
      g.line(nose[0], nose[1], l[0], l[1], "█", KEYS[SHIP]);
      g.line(nose[0], nose[1], r[0], r[1], "█", KEYS[SHIP]);
      g.line(l[0], l[1], m[0], m[1], "▓", KEYS[SHIP + 2]);
      g.line(r[0], r[1], m[0], m[1], "▓", KEYS[SHIP + 2]);
      g.set(nose[0], nose[1], "█", KEYS[SHIP + 1]);
    }
    g.text(1, 0, " SCORE " + String(st.score).padStart(6, "0") + " ", KEYS[UI]);
    g.text(19, 0, " " + "▲ ".repeat(Math.max(0, st.lives)), KEYS[UI + 2]);
    g.text(cols - 11, 0, " WAVE " + String(st.wave).padStart(2, "0") + " ", KEYS[UI + 3]);
    if (st.clear) g.text(cols / 2 - 7, rows / 2, " WAVE CLEARED ", KEYS[UI + 3]);
    return g.frame();
  };
}
