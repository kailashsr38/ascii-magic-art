/* walking-dog: a golden dog trotting along a park path, tail wagging and ears bouncing as the scenery rolls by. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#4a8ad4", "#78aee4", "#acd0f0", "#dceef8"], 8));
const FAR = add(gradient(["#3a6a4a", "#4e8458", "#6a9e68"], 4));
const TREE = add(gradient(["#1e4a1e", "#2e6a26", "#4a8a34", "#6aa844"], 6));
const TRUNK = add(["#3a2614", "#5a3c20"]);
const GRASS = add(gradient(["#2e6a1e", "#4a8a28", "#6aa834"], 4));
const PATH = add(gradient(["#8a7458", "#a8906e", "#c4ac88", "#dcc6a2"], 6));
const FUR = add(gradient(["#7a4a1a", "#a06424", "#c48434", "#dca450", "#ecc070", "#f8dca0"], 12));
const DARK = add(["#140c06", "#2a1a0e"]);
const COLLAR = add(["#d8283a", "#f6d040"]);
const TONGUE = add(["#f07a8a"]);
const CLOUD = add(["#ffffff", "#e6eef6"]);

export const meta = {
  slug: "walking-dog",
  name: "Walking Dog",
  category: "animals",
  note: "A golden dog trots happily along a park path, tail wagging and ears bouncing while the trees and clouds roll by.",
  tags: ["dog", "pets", "walk", "park", "loader", "hero"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";
const SPEED = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const gy = 25;
  const r = rng(91);
  const trees = Array.from({ length: 7 }, (_, i) => [i * 26 + r() * 10, 5 + r() * 3, 0.6 + r() * 0.4]);
  const blob = (cx, cy, rx, ry, fn) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, dx, dy, d);
    }
  };
  const cap = (x0, y0, x1, y1, rad, keyFn) => {
    const dx = x1 - x0, dy = (y1 - y0) * 2, L2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(y0, y1) - rad); y <= Math.max(y0, y1) + rad; y++) for (let x = Math.floor(Math.min(x0, x1) - rad * 2); x <= Math.max(x0, x1) + rad * 2; x++) {
      const px = x - x0, py = (y - y0) * 2;
      const u = clamp((px * dx + py * dy) / L2);
      const d = Math.hypot(px - u * dx, py - u * dy) / (rad * 2);
      if (d <= 1) g.set(x, y, d > 0.8 ? "▓" : "█", keyFn(d, y));
    }
  };
  const furKey = (shade) => (d, y) => KEYS[FUR + Math.max(0, Math.min(11, Math.floor(shade * 12 - d * 2)))];
  return (t) => {
    g.clear();
    const scroll = t * SPEED;
    for (let y = 0; y < gy; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.15 + (y / gy) * 0.85);
      const c = fbm((x + scroll * 0.08) * 0.04, y * 0.25, 3, 5);
      if (c > 0.62 && y < 9) g.set(x, y, c > 0.68 ? "█" : "▓", KEYS[CLOUD + (c > 0.66 ? 0 : 1)]);
      else g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(7, Math.floor(v * 8))]);
    }
    for (let x = 0; x < cols; x++) {
      const h = 14 + Math.floor(fbm((x + scroll * 0.2) * 0.04, 1, 3, 6) * 5);
      for (let y = h; y < gy; y++) g.set(x, y, "█", KEYS[FAR + Math.min(3, Math.floor((y - h) / 2))]);
    }
    for (const [tx0, th, ts] of trees) {
      let tx = (tx0 - scroll * 0.55) % 182; if (tx < 0) tx += 182; tx -= 30;
      for (let y = gy - 7; y < gy; y++) { g.set(tx, y, "█", KEYS[TRUNK + 1]); g.set(tx + 1, y, "█", KEYS[TRUNK]); }
      blob(tx + 0.5, gy - 9 - th * 0.5, 9 * ts + 3, 5 * ts + 1.5, (x, y, dx, dy, d) => {
        const n = noise2(x * 0.5 + scroll * 0.27, y * 0.8, 4);
        if (d + (n - 0.5) * 0.5 < 1) g.set(x, y, n > 0.6 ? "&" : n > 0.4 ? "▓" : "█", KEYS[TREE + Math.min(5, Math.floor((0.6 - dy * 0.35 + n * 0.4) * 5))]);
      });
    }
    for (let x = 0; x < cols; x++) {
      const n = noise2((x + scroll) * 0.8, 2, 3);
      g.set(x, gy - 1, n > 0.6 ? "/" : n > 0.3 ? "|" : "\\", KEYS[GRASS + 2]);
      g.set(x, gy, "▀", KEYS[GRASS + 1]);
    }
    for (let y = gy + 1; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = noise2((x + scroll) * 0.35, y * 0.9, 7);
      g.set(x, y, n > 0.75 ? "o" : n > 0.5 ? "▓" : "█", KEYS[PATH + Math.min(5, Math.floor(n * 4 + (y - gy) * 0.4))]);
    }
    const ph = t * 6.5;
    const bob = Math.abs(Math.sin(ph)) * 0.4;
    const by = 16 - bob, bx0 = 34, bx1 = 52;
    const hipB = [bx0 + 1, by + 1.5], hipF = [bx1 - 1, by + 1.5];
    const leg = (hip, a, far) => {
      const L = 4.2;
      const kx = hip[0] + Math.sin(a) * L * 1.1, ky = hip[1] + Math.cos(a) * L * 0.5 + 1.5;
      const lift = Math.max(0, Math.sin(a + Math.PI / 2)) * 1.0;
      const fx = kx + Math.sin(a * 0.6) * 1.5, fy = gy - 0.5 - lift;
      const sh = far ? 0.45 : 0.75;
      cap(hip[0], hip[1], kx, ky, 1.4, furKey(sh));
      cap(kx, ky, fx, fy, 0.9, furKey(sh - 0.05));
      g.set(fx + 1, Math.round(fy), "▀", KEYS[FUR + (far ? 2 : 4)]);
    };
    leg(hipB, Math.sin(ph + Math.PI) * 0.6, true);
    leg(hipF, Math.sin(ph) * 0.6, true);
    const wag = Math.sin(t * 11) * 0.7;
    let tx = bx0 - 1, ty = by - 1;
    for (let k = 0; k < 7; k++) {
      const a = -2.2 + wag * (k / 6) - k * 0.08;
      const nx = tx + Math.cos(a) * 1.6, ny = ty + Math.sin(a) * 0.8;
      cap(tx, ty, nx, ny, 0.75 - k * 0.05, furKey(0.85));
      tx = nx; ty = ny;
    }
    cap(bx0, by, bx1, by, 3.3, (d, y) => KEYS[FUR + Math.max(0, Math.min(11, Math.floor((0.95 - (y - by + 3) * 0.1) * 12 - d * 3)))]);
    cap(bx0 - 0.5, by + 1.5, bx0 + 3, by + 2.5, 2.2, furKey(0.7));
    leg(hipB, Math.sin(ph) * 0.6, false);
    leg(hipF, Math.sin(ph + Math.PI) * 0.6, false);
    const hx = 59, hy = 11 - bob * 0.5;
    cap(bx1 - 1, by - 0.5, hx - 1, hy + 1, 2.5, furKey(0.85));
    for (let k = -2; k <= 2; k++) g.set(bx1 + 2 + k * 0.4, by - 2 + k, "█", KEYS[COLLAR]);
    g.set(bx1 + 3, by + 0.8, "●", KEYS[COLLAR + 1]);
    blob(hx, hy, 6.5, 3.4, (x, y, dx, dy, d) => g.set(x, y, d > 0.8 ? "▓" : "█", KEYS[FUR + Math.max(0, Math.min(11, Math.floor((0.95 - dy * 0.25) * 12 - d * 2)))]));
    cap(hx + 3, hy + 1, hx + 8, hy + 1.6, 1.5, furKey(0.9));
    g.set(hx + 9, hy + 1, "●", KEYS[DARK]);
    g.set(hx + 7, hy + 3, "▼", KEYS[TONGUE]);
    g.set(hx + 6, hy + 2.6, "▄", KEYS[DARK + 1]);
    g.set(hx + 2, hy - 0.8, "●", KEYS[DARK]);
    const ear = Math.sin(ph + 0.6) * 0.5;
    cap(hx - 1.5, hy - 2.5, hx - 3.5 + ear, hy + 2.5, 1.2, () => KEYS[FUR + 1]);
    return g.frame();
  };
}
