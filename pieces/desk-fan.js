/* desk-fan: an electric desk fan, blades spinning behind the guard while the head sweeps side to side. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const ROOM = gradient(["#0e1a22", "#18303a", "#24464f", "#2f5a60"], 6);    // 0-5
const BLADE = gradient(["#1f6f8b", "#2fa3b8", "#7fe0e8", "#d8fbff"], 6);   // 6-b
const BODY = gradient(["#3a4048", "#6e7682", "#aab2bc", "#eef2f6"], 8);    // c-j
const pal = palette([...ROOM, ...BLADE, ...BODY, "#ff6a4a", "#1a2228"]);    // k red badge, l shadow

export const meta = {
  slug: "desk-fan",
  name: "Desk Fan",
  category: "things",
  note: "An electric desk fan with spinning blades behind a wire guard, its head slowly sweeping left and right.",
  tags: ["fan", "summer", "loader", "cool", "hero"],
  cols: 60, rows: 38, fps: 30,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 30, cy = 14, R = 22;
  return (t) => {
    const yaw = 0.55 * Math.sin(t * 0.6);
    const sx = Math.cos(yaw), shift = Math.sin(yaw) * 4;
    const spin = t * 9;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(fbm(x * 0.06, y * 0.14, 3) * 0.6 + (1 - y / rows) * 0.2 + Math.sin(x * 0.4) * 0.03);
      g.set(x, y, y > 32 ? "▓" : v > 0.5 ? "▒" : "░", y > 32 ? "1" : KEYS[Math.min(5, Math.floor(v * 6))]);
    }
    // base and neck
    for (let y = 32; y <= 35; y++) for (let x = cx - 12; x <= cx + 12; x++) {
      const d = Math.hypot((x - cx) / 12, (y - 33.5) / 2.2);
      if (d <= 1) g.set(x, y, "█", KEYS[12 + Math.min(7, Math.floor(clamp(0.8 - (x - cx) / 24 - (y - 32) * 0.12) * 8))]);
    }
    g.set(cx + 6, 33, "●", "k");
    for (let y = 22; y <= 32; y++) for (let x = cx - 1; x <= cx + 1; x++) g.set(x, y, "█", x === cx - 1 ? "i" : x === cx ? "g" : "e");
    // motor housing, peeking out behind the guard on the far side
    const mx = cx + shift - Math.sin(yaw) * 11;
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = Math.floor(mx - 8); x <= Math.ceil(mx + 8); x++) {
      if (Math.hypot((x - mx) / 8, (y - cy) / 4) <= 1) g.set(x, y, "█", KEYS[12 + 3 + (x < mx ? 1 : 0)]);
    }
    // the head: guard rings, radial wires, blades and hub
    const hx = cx + shift;
    for (let y = cy - 12; y <= cy + 12; y++) for (let x = 0; x < cols; x++) {
      const u = (x - hx) / (R * sx), v = (y - cy) / (R * 0.5);
      const d = Math.hypot(u, v);
      if (d > 1.04) continue;
      const a = Math.atan2(v, u);
      let ch = null, co;
      if (d > 0.96) { ch = "█"; co = KEYS[12 + Math.min(7, Math.floor(clamp(0.7 - u * 0.3 - v * 0.2) * 8))]; }
      else if (d < 0.17) { ch = "█"; co = KEYS[12 + Math.min(7, Math.floor(clamp(0.9 - (u + v) * 1.5) * 8))]; if (d < 0.07) { ch = "●"; co = "k"; } }
      else {
        // three blades with a soft trailing blur
        let best = 0;
        for (let k = 0; k < 3; k++) {
          let da = a - spin - (k * TAU) / 3;
          da = ((da % TAU) + TAU + Math.PI) % TAU - Math.PI;
          const width = 0.55 + d * 0.25;
          const core = da > -width && da < width * 0.6 ? 1 : 0;
          const trail = da < -width && da > -width - 0.7 ? 1 - (-width - da) / 0.7 : 0;
          if (d < 0.9) best = Math.max(best, core ? 0.6 + (1 - Math.abs(da) / width) * 0.4 : trail * 0.45);
        }
        const ring = [0.35, 0.6, 0.82].some((r) => Math.abs(d - r) < 0.025);
        const wire = Math.abs(Math.sin(a * 8)) < 0.08 && d > 0.2;
        if (best > 0.5) { ch = best > 0.8 ? "█" : "▓"; co = KEYS[6 + Math.min(5, Math.floor(best * 6 - 0.5))]; }
        else if (best > 0.08) { ch = "▒"; co = KEYS[6 + 1]; }
        if (ring || wire) { ch = ring ? "─" : "·"; co = "g"; if (ring && Math.abs(v) > Math.abs(u) * 2.2) ch = "·"; }
      }
      if (ch) g.set(x, y, ch, co);
    }
    return g.frame();
  };
}
