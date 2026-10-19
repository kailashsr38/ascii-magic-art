/* alien-wave: rows of aliens marching down while a cannon picks them off. */
import { Grid, palette, KEYS, rng, clamp } from "../lib/kit.js";

const UI = ["#05060c", "#1a1f33", "#ff5a8a", "#ffd84a", "#5ee0e8", "#7ee787", "#e6edf3", "#ff7b3a", "#8b949e", "#ffffff", "#3a4060"];

export const meta = {
  slug: "alien-wave",
  name: "Alien Wave",
  category: "arcade",
  note: "Rows of aliens march side to side and down while a cannon behind its bunkers picks them off.",
  tags: ["aliens", "shooter", "game", "arcade", "retro", "space"],
  cols: 64, rows: 28, fps: 20,
  palette: palette(UI),
};

const W = 64, H = 28, NX = 9, NY = 5, SPX = 6, CY = 25, BUNK_Y = 21;
const SPR = [["/▀\\", "\\▀/"], ["{●}", "}●{"], ["<█>", ">█<"]];
const ROWTYPE = [0, 1, 1, 2, 2], ROWCOL = ["2", "3", "3", "4", "4"], ROWPTS = [30, 20, 20, 10, 10];

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

function newWave(st) {
  st.alive = new Uint8Array(NX * NY).fill(1); st.count = NX * NY;
  st.ax = 4; st.ay = 3 + Math.min(4, st.wave); st.adir = 1; st.frame = 0; st.tick = 0;
  st.bombs = []; st.shot = null; st.boom = [];
}
function newGame(st) {
  st.score = 0; st.lives = 3; st.wave = 0; st.cx = 30; st.over = 0; st.hit = 0;
  st.bunk = new Uint8Array(W * 3);
  for (let b = 0; b < 4; b++) for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) {
    if (j === 2 && i > 1 && i < 5) continue;
    st.bunk[j * W + 6 + b * 15 + i] = 2;
  }
  st.ufo = null;
  newWave(st);
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(20, 20 * 150, (round) => {
    const st = { r: rng(19 + round * 271), best: 0 };
    newGame(st); return st;
  }, (st) => {
    if (st.over) { if (++st.over > 60) newGame(st); return; }
    st.boom = st.boom.filter((b) => ++b[2] < 5);
    if (st.hit) { if (++st.hit > 30) { st.hit = 0; st.bombs = []; } return; }
    // march: fewer aliens means faster steps
    const every = Math.max(1, Math.round(1 + (st.count / (NX * NY)) * 7));
    if (++st.tick >= every) {
      st.tick = 0; st.frame ^= 1;
      let minX = 99, maxX = -1;
      for (let i = 0; i < NX * NY; i++) if (st.alive[i]) { const x = i % NX; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
      const left = st.ax + minX * SPX, right = st.ax + maxX * SPX + 2;
      if ((st.adir > 0 && right >= W - 2) || (st.adir < 0 && left <= 1)) { st.ay++; st.adir = -st.adir; }
      else st.ax += st.adir;
    }
    // lowest living alien
    let lowY = 0;
    for (let i = 0; i < NX * NY; i++) if (st.alive[i]) lowY = Math.max(lowY, st.ay + Math.floor(i / NX) * 2);
    if (lowY >= BUNK_Y) { st.over = 1; return; }
    // bombs
    if (st.r() < 0.06 + 0.02 * st.wave) {
      const col = Math.floor(st.r() * NX);
      for (let y = NY - 1; y >= 0; y--) if (st.alive[y * NX + col]) { st.bombs.push([st.ax + col * SPX + 1, st.ay + y * 2 + 1]); break; }
    }
    for (const b of st.bombs) b[1] += 0.5;
    st.bombs = st.bombs.filter((b) => {
      const bx = Math.round(b[0]), by = Math.floor(b[1]);
      if (by >= BUNK_Y && by < BUNK_Y + 3 && st.bunk[(by - BUNK_Y) * W + bx]) { st.bunk[(by - BUNK_Y) * W + bx]--; return false; }
      if (by === CY && Math.abs(bx - (st.cx + 1)) <= 1) {
        st.lives--; st.hit = 1; st.boom.push([st.cx + 1, CY, 0]);
        if (st.lives <= 0) st.over = 1;
        return false;
      }
      return by < H;
    });
    // ufo
    if (!st.ufo && st.r() < 0.004) st.ufo = { x: -4, dir: 1 };
    if (st.ufo) { st.ufo.x += 0.6; if (st.ufo.x > W + 4) st.ufo = null; }
    // cannon AI: dodge bombs overhead, else line up under the most exposed column
    let targetX = st.cx;
    let best = -1;
    for (let x = 0; x < NX; x++) {
      for (let y = NY - 1; y >= 0; y--) if (st.alive[y * NX + x]) {
        const ax = st.ax + x * SPX + 1;
        const score = (y + 1) * 3 - Math.abs(ax - st.cx) * 0.2;
        if (score > best) { best = score; targetX = ax - 1; }
        break;
      }
    }
    const danger = (x) => st.bombs.some((b) => Math.abs(b[0] - (x + 1)) <= 2 && b[1] > CY - 8);
    if (danger(st.cx)) {
      const l = !danger(st.cx - 3) && st.cx > 3, rr = !danger(st.cx + 3) && st.cx < W - 6;
      targetX = l ? st.cx - 4 : rr ? st.cx + 4 : st.cx;
    }
    st.cx = clamp(st.cx + clamp(targetX - st.cx, -1, 1), 1, W - 4);
    if (!st.shot && Math.abs(targetX - st.cx) <= 1 && !danger(st.cx)) st.shot = [st.cx + 1, CY - 1];
    if (st.shot) {
      for (let s = 0; s < 2 && st.shot; s++) {
        st.shot[1] -= 1;
        const sx = st.shot[0], sy = st.shot[1];
        if (sy < 1) { st.shot = null; break; }
        if (st.ufo && sy === 1 && Math.abs(sx - (st.ufo.x + 2)) <= 2) { st.score += 100; st.boom.push([sx, 1, 0]); st.ufo = null; st.shot = null; break; }
        const gx = sx - st.ax, gy = sy - st.ay;
        if (gx >= 0 && gy >= 0 && gy % 2 === 0) {
          const ix = Math.floor(gx / SPX), iy = gy / 2;
          if (ix < NX && iy < NY && gx % SPX < 3 && st.alive[iy * NX + ix]) {
            st.alive[iy * NX + ix] = 0; st.count--; st.score += ROWPTS[iy]; st.best = Math.max(st.best, st.score);
            st.boom.push([st.ax + ix * SPX + 1, sy, 0]); st.shot = null;
            if (!st.count) { st.wave++; newWave(st); }
          }
        }
      }
    }
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let h = Math.imul(x * 73856093 ^ y * 19349663, 1274126177); h = ((h ^ (h >>> 15)) >>> 0) % 61;
      g.set(x, y, y > 0 && h === 0 ? "·" : y > 0 && h === 1 ? "." : " ", h === 0 ? "a" : "1");
    }
    g.text(1, 0, "SCORE " + String(st.score % 100000).padStart(5, "0"), "6");
    g.text(22, 0, "HI " + String(st.best % 100000).padStart(5, "0"), "8");
    g.text(cols - 12, 0, "WAVE " + String(st.wave + 1).padStart(2, "0"), "8");
    if (st.ufo) g.text(Math.round(st.ufo.x), 1, "<▀▀>", "2");
    for (let i = 0; i < NX * NY; i++) if (st.alive[i]) {
      const x = i % NX, y = Math.floor(i / NX);
      g.text(st.ax + x * SPX, st.ay + y * 2, SPR[ROWTYPE[y]][st.frame], ROWCOL[y]);
    }
    for (let j = 0; j < 3; j++) for (let x = 0; x < W; x++) {
      const v = st.bunk[j * W + x];
      if (v) g.set(x, BUNK_Y + j, v > 1 ? "█" : "▒", "5");
    }
    for (const b of st.bombs) g.set(Math.round(b[0]), Math.floor(b[1]), Math.floor(b[1] * 2) % 2 ? "╲" : "╱", "7");
    if (st.shot) g.set(st.shot[0], st.shot[1], "│", "9");
    if (!st.hit || Math.floor(st.hit / 3) % 2) { g.text(st.cx, CY - 1, " ▄ ", "5"); g.text(st.cx, CY, "▟█▙", "5"); }
    for (const [bx, by, a] of st.boom) g.text(bx - 1, by, a < 2 ? "\\|/" : "·*·", "7");
    g.hline(0, cols - 1, H - 2, "▀", "5");
    g.text(1, H - 1, "LIVES", "8");
    for (let i = 0; i < st.lives; i++) g.text(8 + i * 4, H - 1, "▟█▙", "5");
    if (st.over) { g.box(cols / 2 - 9, 11, 18, 3, "double", "6"); g.text(cols / 2 - 8, 12, "   GAME  OVER   ", "6"); }
    return g.frame();
  };
}
