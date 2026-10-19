/* blue-green-deploy: the idle colour gets the new release, passes smoke tests, then the router flips all traffic over. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "blue-green-deploy",
  name: "Blue Green Switch",
  category: "explainers",
  note: "A blue and green deployment where the idle environment boots the new release, passes its smoke tests, and the router flips every request across in one step while the old side drains and stands by.",
  tags: ["deploy", "devops", "release", "diagram", "infrastructure", "docs"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681", "#2f81f7", "#3fb950"]),
};

const CHECKS = ["GET /health      200", "POST /login      200", "GET /orders      200", "db migrations    ok"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CYC = 14;
  const ENV = [["blue", 2, "3", "c"], ["green", 52, "4", "d"]];
  return (t) => {
    g.clear();
    const n = Math.floor(t / CYC), ct = t - n * CYC;
    const live = n % 2; // env index live before this cycle's switch
    const target = 1 - live;
    const oldV = "v2." + (13 + n), newV = "v2." + (14 + n);
    const phase = ct < 2 ? "live" : ct < 6 ? "deploy" : ct < 8.5 ? "test" : ct < 9.5 ? "switch" : "drain";
    const switched = ct >= 9.5;
    const sw = clamp((ct - 8.5) / 1.0);
    const active = switched ? target : live;
    // users and router
    g.box(41, 1, 18, 3, "round", "0");
    g.text(44, 2, "users", "0");
    const rps = 1800 + Math.round(Math.sin(t * 0.7) * 120);
    g.text(61, 2, rps + " req/s", "1");
    g.vline(50, 4, 5, "│", "b");
    g.box(38, 6, 24, 4, "heavy", "a");
    g.text(40, 7, "router", "0");
    const arrow = active === 0 ? "◀ blue" : "green ▶";
    g.text(phase === "switch" ? 45 : active === 0 ? 40 : 53, 8, phase === "switch" ? "switching" : arrow, phase === "switch" ? "a" : ENV[active][2]);
    // branch lines
    const lineCo = (e) => (e === active ? ENV[e][2] : "2");
    g.hline(24, 37, 8, "─", lineCo(0)); g.vline(24, 9, 12, "│", lineCo(0)); g.set(24, 8, "┌", lineCo(0));
    g.hline(62, 75, 8, "─", lineCo(1)); g.vline(75, 9, 12, "│", lineCo(1)); g.set(75, 8, "┐", lineCo(1));
    // packets
    for (let k = 0; k < 4; k++) {
      const f = (t * 1.1 + k / 4) % 1;
      g.set(50, 4 + Math.floor(f * 2), "•", "0");
      const e = phase === "switch" ? (f < sw ? target : live) : active;
      const L = 13 + 4;
      const d = Math.floor(f * L);
      if (e === 0) { const x = 37 - Math.min(d, 13); const y = d > 13 ? 8 + (d - 13) : 8; g.set(d > 13 ? 24 : x, y, "●", "3"); }
      else { const x = 62 + Math.min(d, 13); const y = d > 13 ? 8 + (d - 13) : 8; g.set(d > 13 ? 75 : x, y, "●", "4"); }
    }
    // environments
    ENV.forEach(([name, x, co], e) => {
      const isLive = e === active;
      const isTarget = e === target;
      const ver = isTarget && ct >= 2 ? newV : oldV;
      g.box(x, 13, 46, 14, isLive ? "heavy" : "round", isLive ? co : "b");
      g.text(x + 2, 13, " " + name + " ", co);
      g.text(x + 10, 13, " " + ver + " ", isLive ? "8" : "1");
      const st = isLive ? "● live" : isTarget && phase === "deploy" ? "● deploying" : isTarget && phase === "test" ? "● testing" : switched && e === live ? "● draining" : "○ standby";
      const sc = isLive ? "4" : st.includes("deploy") || st.includes("test") ? "a" : st.includes("drain") ? "5" : "1";
      g.text(x + 46 - 2 - st.length, 13, st, sc);
      // instances
      for (let i = 0; i < 3; i++) {
        const ix = x + 2 + i * 14, iy = 15;
        let state = "up", prog = 1;
        if (isTarget && phase === "deploy") { prog = clamp((ct - 2 - i * 0.6) / 2.2); state = prog >= 1 ? "up" : prog > 0 ? "boot" : "old"; }
        const c = isLive ? co : state === "boot" ? "a" : "b";
        g.box(ix, iy, 13, 5, "round", c);
        g.text(ix + 2, iy + 1, "app-" + name[0] + (i + 1), isLive ? "0" : "1");
        if (state === "boot") {
          const W = 9, m = Math.round(prog * W);
          for (let k = 0; k < W; k++) g.set(ix + 2 + k, iy + 2, k < m ? "█" : "░", k < m ? "a" : "2");
          g.text(ix + 2, iy + 3, "pulling", "a");
        } else {
          let load = 0;
          if (isLive) load = Math.round(rps / 3 + Math.sin(t * 2 + i) * 30);
          else if (switched && e === live) load = Math.max(0, Math.round((rps / 3) * (1 - (ct - 9.5) / 2.5)));
          g.text(ix + 2, iy + 2, (load ? "● " : "○ ") + (isTarget && ct >= 2 && phase !== "live" ? newV : ver), load ? "4" : "1");
          g.text(ix + 2, iy + 3, load + " rps", load ? "0" : "b");
        }
      }
      // smoke tests panel inside target
      if (isTarget && (phase === "test" || phase === "switch")) {
        CHECKS.forEach((c, i) => {
          const ok = ct - 6 > i * 0.55 + 0.3;
          g.text(x + 2, 21 + i, ok ? "✓" : "·", ok ? "4" : "a");
          g.text(x + 4, 21 + i, c, ok ? "0" : "1");
        });
      } else if (isLive) {
        g.text(x + 2, 21, "error rate", "1"); g.text(x + 16, 21, "0.02%", "4");
        g.text(x + 2, 22, "p95", "1"); g.text(x + 16, 22, (120 + Math.round(Math.sin(t) * 8)) + " ms", "0");
        g.text(x + 2, 23, "connections", "1"); g.text(x + 16, 23, String(3400 + Math.round(Math.sin(t * 1.3) * 90)), "0");
      } else if (switched && e === live) {
        const left = Math.max(0, Math.round(3400 * (1 - (ct - 9.5) / 2.5)));
        g.text(x + 2, 21, "connections", "1"); g.text(x + 16, 21, String(left), left ? "5" : "1");
        g.text(x + 2, 22, left ? "draining in-flight requests" : "kept warm for instant rollback", "1");
      } else if (isTarget && phase === "deploy") {
        g.text(x + 2, 21, "rolling out " + newV + " to idle side", "a");
        g.text(x + 2, 22, "no user traffic yet", "1");
      } else {
        g.text(x + 2, 21, "idle, ready for next release", "1");
      }
    });
    // timeline footer
    const steps = [["live", 0], ["deploy", 2], ["test", 6], ["switch", 8.5], ["drain", 9.5]];
    let fx = 2;
    g.text(1, 0, "deploy " + newV, "0");
    steps.forEach(([name, s], i) => {
      const on = phase === name, done = ct >= s && !on;
      g.text(fx, rows - 2, (on ? "▶ " : done ? "✓ " : "· ") + name, on ? "a" : done ? "4" : "b");
      fx += name.length + 3;
      if (i < steps.length - 1) { g.text(fx, rows - 2, "──", "2"); fx += 3; }
    });
    return g.frame();
  };
}
