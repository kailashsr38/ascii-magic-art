/* tower-defence-wave: creeps march down a winding road while turrets built beside it fire, freeze and zap them. */
import { Grid, palette, gradient, KEYS, rng, fbm, noise2 } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const GRASS = add(gradient(["#183a1a", "#22502a", "#2e6a34", "#3e8440"], 6));
const TREE = add(["#0c2410", "#1a4220", "#2f6a2e"]);
const ROCK = add(["#5a5a62", "#8a8a94"]);
const PATH = add(gradient(["#5a4024", "#7a5832", "#9a7244", "#b48c58"], 5));
const TW = add(["#ff9a3a", "#5ae0f4", "#e06af0", "#8a8f9a", "#c8ccd4", "#3a3d46"]);
const EN = add(["#ff5a5a", "#ffd23a", "#9a6af0", "#ffffff", "#6af06a"]);
const FX = add(["#ffffff", "#fff0a0", "#ff8a3a", "#a8f4ff", "#f4a0ff"]);
const CAS = add(["#9aa0ac", "#d0d4dc", "#4a8af0", "#ff4a4a"]);
const UI = add(["#0d1117", "#30363d", "#e6edf3", "#8b949e", "#ffd166", "#ff7b72", "#7ee787"]);

export const meta = {
  slug: "tower-defence-wave",
  name: "Tower Defence Wave",
  category: "arcade",
  note: "Waves of creeps march along a winding dirt road while cannon, frost and laser towers built beside it hold the line.",
  tags: ["tower defence", "strategy", "game", "retro", "waves", "dashboard"],
  cols: 96, rows: 30, fps: 20,
  palette: palette(P),
};

const RATE = 20, DT = 1 / RATE, ROUND = 72;
const MW = 36, MH = 26, OX = 0, OY = 2;
const WP = [[-1, 4], [9, 4], [9, 14], [3, 14], [3, 22], [17, 22], [17, 7], [26, 7], [26, 18], [36, 18]];
const SEG = [];
let PLEN = 0;
for (let i = 0; i < WP.length - 1; i++) { const l = Math.abs(WP[i + 1][0] - WP[i][0]) + Math.abs(WP[i + 1][1] - WP[i][1]); SEG.push(l); PLEN += l; }
function at(s) {
  for (let i = 0; i < SEG.length; i++) {
    if (s <= SEG[i]) { const f = s / SEG[i]; return [WP[i][0] + (WP[i + 1][0] - WP[i][0]) * f, WP[i][1] + (WP[i + 1][1] - WP[i][1]) * f]; }
    s -= SEG[i];
  }
  return WP[WP.length - 1];
}
// [tile x, tile y, type, wave it appears]
const TOWERS = [[20, 10, 0, 0], [22, 15, 1, 0], [29, 12, 2, 1], [14, 19, 0, 1], [6, 17, 1, 2], [23, 4, 2, 2], [12, 10, 0, 3], [6, 6, 2, 3], [31, 21, 1, 4], [12, 25, 2, 4]];
const SPEC = [{ range: 6.5, cd: 16, dmg: 26, name: "CANNON" }, { range: 5.5, cd: 10, dmg: 6, name: "FROST" }, { range: 7, cd: 4, dmg: 7, name: "LASER" }];

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

function step(st) {
  st.tick++;
  const wave = Math.floor(st.tick / (RATE * 14));
  if (wave !== st.wave) { st.wave = wave; st.spawnLeft = 8 + wave * 3; st.spawnCd = 0; st.gold += 60; }
  if (st.spawnLeft > 0 && --st.spawnCd <= 0) {
    const type = st.spawnLeft % 5 === 0 ? 2 : st.spawnLeft % 3 === 0 ? 1 : 0;
    const hp = [40, 22, 120][type] * (1 + st.wave * 0.35);
    st.en.push({ s: 0, type, hp, max: hp, slow: 0, id: st.nid++ });
    st.spawnLeft--; st.spawnCd = type === 2 ? 22 : 12;
  }
  for (const e of st.en) {
    const v = [2.6, 4.2, 1.6][e.type] * (e.slow > 0 ? 0.45 : 1);
    e.s += v * DT; if (e.slow > 0) e.slow--;
  }
  const alive = [];
  for (const e of st.en) {
    if (e.hp <= 0) { st.fx.push({ x: e.x, y: e.y, age: 0, kind: "boom" }); st.gold += 5 + e.type * 5; st.kills++; continue; }
    if (e.s >= PLEN) { st.lives = Math.max(0, st.lives - 1); continue; }
    [e.x, e.y] = at(e.s); alive.push(e);
  }
  st.en = alive;
  for (const T of st.towers) {
    if (T.cd > 0) { T.cd--; continue; }
    const S = SPEC[T.type];
    let best = null;
    for (const e of st.en) { const d = Math.hypot(e.x - T.x, (e.y - T.y) * 1); if (d <= S.range && (!best || e.s > best.s)) best = e; }
    if (!best) continue;
    best.hp -= S.dmg; T.cd = S.cd; T.aim = Math.atan2(best.y - T.y, best.x - T.x);
    if (T.type === 1) best.slow = 30;
    st.fx.push({ x: T.x, y: T.y, tx: best.x, ty: best.y, age: 0, kind: T.type });
  }
  st.fx = st.fx.filter((f) => ++f.age < (f.kind === "boom" ? 8 : f.kind === 0 ? 6 : 3));
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const onPath = new Uint8Array(MW * MH);
  for (let s = 0; s <= PLEN; s += 0.25) {
    const [x, y] = at(s);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xi = Math.round(x) + dx, yi = Math.round(y) + dy;
      if (xi >= 0 && xi < MW && yi >= 0 && yi < MH) onPath[xi + yi * MW] = Math.max(onPath[xi + yi * MW], dx || dy ? 1 : 2);
    }
  }
  const bg = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW * 2; x++) {
    const tx = x >> 1;
    const n = fbm(x * 0.08, y * 0.16, 3, 4);
    if (onPath[tx + y * MW]) { const m = noise2(x * 0.5, y, 2); const c = onPath[tx + y * MW] === 2; bg.push([m > 0.7 ? "▒" : m < 0.25 ? "░" : "▓", KEYS[PATH + (c ? 2 : 1) + Math.floor(m * 2.4)]]); continue; }
    let near = false;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = tx + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < MW && yy < MH && onPath[xx + yy * MW]) near = true; }
    const tree = !near && n > 0.64;
    const rock = !near && !tree && noise2(x * 1.7, y * 2.3, 9) > 0.86;
    bg.push(tree ? [n > 0.7 ? "█" : "▓", KEYS[TREE + (n > 0.7 ? 2 : 1)]] : rock ? ["●", KEYS[ROCK + (x % 2)]] : [(x + y) % 3 ? "▓" : "▒", KEYS[GRASS + 1 + Math.floor(n * 4.9)]]);
  }
  const sim = makeSim(RATE, RATE * ROUND, (r) => ({
    r: rng(5 + r), tick: 0, wave: -1, en: [], fx: [], towers: [], nid: 0, gold: 100, lives: 20, kills: 0, spawnLeft: 0, spawnCd: 0,
  }), (st) => {
    for (const [x, y, type, w] of TOWERS) if (w <= st.wave + 0 && !st.towers.some((T) => T.x === x && T.y === y)) st.towers.push({ x, y, type, cd: 0, aim: 0 });
    step(st);
  });
  const SX = (x) => OX + Math.round(x * 2), SY = (y) => OY + Math.round(y);
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW * 2; x++) { const [c, k] = bg[y * MW * 2 + x]; g.set(OX + x, OY + y, c, k); }
    // castle at the end
    const cx = SX(33), cy = SY(18) - 3;
    g.text(cx, cy, "▄ ▄ ▄", KEYS[CAS + 1]); g.text(cx, cy + 1, "█▀█▀█", KEYS[CAS]); g.text(cx, cy + 2, "█▓▀▓█", KEYS[CAS]); g.text(cx, cy + 3, "██▄██", KEYS[CAS]);
    g.set(cx + 2, cy - 1, "▶", KEYS[CAS + 3]);
    for (const T of st.towers) {
      const x = SX(T.x) - 1, y = SY(T.y) - 1;
      const ax = Math.cos(T.aim), ay = Math.sin(T.aim);
      const barrel = Math.abs(ax) > Math.abs(ay) * 1.5 ? (ax > 0 ? "▶" : "◀") : ay > 0 ? "▼" : "▲";
      g.text(x, y, "▄█▄", KEYS[TW + T.type]);
      g.set(x + 1, y, barrel, KEYS[TW + T.type]);
      g.text(x, y + 1, "▐█▌", KEYS[TW + 3]);
      g.set(x + 1, y + 1, "▓", KEYS[TW + 4]);
    }
    for (const e of st.en) {
      const x = SX(e.x), y = SY(e.y);
      const f = Math.floor(t * 8 + e.id) % 2;
      const body = [f ? "●" : "○", "◆", "■"][e.type];
      const ec = KEYS[e.slow > 0 ? FX + 3 : EN + e.type];
      g.set(x - 1, y, e.type === 2 ? "▐" : f ? "/" : "\\", ec);
      g.set(x, y, body, ec);
      g.set(x + 1, y, e.type === 2 ? "▌" : f ? "\\" : "/", ec);
      const hb = Math.max(0, Math.ceil((e.hp / e.max) * 2));
      g.text(x - 1, y - 1, "▄▄▄".slice(0, Math.ceil((e.hp / e.max) * 3)).padEnd(3, "▁"), KEYS[hb === 2 ? UI + 6 : UI + 5]);
    }
    for (const f of st.fx) {
      if (f.kind === "boom") {
        const r = f.age * 0.4;
        for (let a = 0; a < 8; a++) g.set(SX(f.x + Math.cos(a * 0.785) * r), SY(f.y + Math.sin(a * 0.785) * r * 0.6), f.age < 3 ? "*" : "·", KEYS[FX + (f.age < 3 ? 1 : 2)]);
        if (f.age < 4) g.set(SX(f.x), SY(f.y), "█", KEYS[FX + 1]);
      } else if (f.kind === 2) {
        g.line(SX(f.x), SY(f.y) - 1, SX(f.tx), SY(f.ty), "·", KEYS[FX + 4]);
        g.set(SX(f.tx), SY(f.ty), "×", KEYS[FX]);
      } else if (f.kind === 1) {
        g.line(SX(f.x), SY(f.y) - 1, SX(f.tx), SY(f.ty), "░", KEYS[FX + 3]);
        g.set(SX(f.tx), SY(f.ty), "*", KEYS[FX + 3]);
      } else {
        const u = f.age / 6;
        g.set(SX(f.x + (f.tx - f.x) * u), SY(f.y - 1 + (f.ty - f.y + 1) * u), "●", KEYS[UI + 1 + 1]);
        if (f.age >= 5) g.text(SX(f.tx) - 1, SY(f.ty), "\\|/", KEYS[FX + 2]);
      }
    }
    // HUD and side panel
    for (let x = 0; x < cols; x++) { g.set(x, 0, " ", KEYS[UI]); g.set(x, 1, "▀", KEYS[UI + 1]); g.set(x, rows - 2, "▄", KEYS[UI + 1]); g.set(x, rows - 1, " ", KEYS[UI]); }
    g.text(1, 0, "WAVE " + String(st.wave + 1).padStart(2, "0"), KEYS[UI + 4]);
    g.text(12, 0, "GOLD " + String(st.gold).padStart(4, " "), KEYS[UI + 4]);
    g.text(25, 0, "LIVES " + String(st.lives).padStart(2, " "), KEYS[UI + 5]);
    g.text(37, 0, "KILLS " + String(st.kills).padStart(3, " "), KEYS[UI + 2]);
    const next = 14 - ((st.tick / RATE) % 14);
    g.text(52, 0, "NEXT WAVE " + next.toFixed(0).padStart(2, " ") + "s", KEYS[UI + 3]);
    const px = MW * 2 + 1;
    for (let y = 2; y < rows - 2; y++) for (let x = px - 1; x < cols; x++) g.set(x, y, " ", KEYS[UI]);
    g.box(px, 2, cols - px - 1, rows - 4, "round", KEYS[UI + 1]);
    g.text(px + 2, 3, "TOWERS", KEYS[UI + 2]);
    SPEC.forEach((S, i) => {
      const n = st.towers.filter((T) => T.type === i).length;
      g.text(px + 2, 5 + i * 2, "▄█▄", KEYS[TW + i]);
      g.text(px + 6, 5 + i * 2, S.name.padEnd(7, " ") + "x" + n, KEYS[UI + 2]);
      g.text(px + 6, 6 + i * 2, "dmg " + S.dmg + " rng " + S.range, KEYS[UI + 3]);
    });
    g.text(px + 2, 12, "ON FIELD", KEYS[UI + 2]);
    const counts = [0, 1, 2].map((k) => st.en.filter((e) => e.type === k).length);
    ["GRUNT", "RUNNER", "BRUTE"].forEach((nm, i) => {
      g.set(px + 2, 14 + i, ["●", "◆", "■"][i], KEYS[EN + i]);
      g.text(px + 4, 14 + i, nm.padEnd(8, " ") + String(counts[i]).padStart(3, " "), KEYS[UI + 3]);
    });
    g.text(px + 2, 18, "INCOMING", KEYS[UI + 2]);
    const bar = Math.round((st.spawnLeft / (8 + Math.max(0, st.wave) * 3)) * 16);
    g.text(px + 2, 19, "█".repeat(bar).padEnd(16, "░"), KEYS[UI + 5]);
    g.text(px + 2, 21, "BASE HP", KEYS[UI + 2]);
    g.text(px + 2, 22, "█".repeat(Math.round(st.lives * 0.8)).padEnd(16, "░"), KEYS[UI + 6]);
    g.text(px + 2, 24, "SPEED  x1", KEYS[UI + 3]);
    g.text(1, rows - 1, "Cannon splashes  Frost slows  Laser zaps", KEYS[UI + 3]);
    return g.frame();
  };
}
