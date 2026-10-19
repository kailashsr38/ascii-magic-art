/* doppler-effect: a moving siren's sound waves bunching up ahead and stretching out behind, with the pitch each listener hears. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#081428", "#0c1c38", "#122648", "#183058"], 4));
add("ring", gradient(["#1e4a7a", "#2a6aa8", "#4a9ad8", "#8acaff", "#d8f0ff"], 5));
add("road", ["#1a1a1e", "#2a2a30", "#e8d070"]);
add("grass", ["#1a3a1a", "#2a4a22"]);
add("car", ["#e8e8ee", "#ff4a4a", "#4a8aff", "#2a2a30"]);
add("hi", ["#ff7b72", "#ffc0b8"]);
add("lo", ["#79c0ff", "#c8e4ff"]);
add("ui", ["#ffffff", "#8b949e"]);

export const meta = {
  slug: "doppler-effect",
  name: "Doppler Effect Siren",
  category: "science",
  note: "A siren drives across while its sound waves crowd together in front and spread out behind, so the listener ahead hears a higher pitch and the one behind a lower one.",
  tags: ["doppler", "sound", "waves", "physics", "education", "science"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const C = 14, V = 0.4 * C, EMIT = 0.42, AGE = 6, X0 = 12, X1 = 88, SY = 19;
const SPAN = (X1 - X0) / V;
const F = 440, FH = Math.round(F / (1 - 0.4)), FL = Math.round(F / (1 + 0.4));

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.1, y * 0.25, 3, 37);
  const srcX = (te) => X0 + V * (((te % SPAN) + SPAN) % SPAN);
  return (t) => {
    g.clear();
    // waves alive now: emitted at k * EMIT within the last AGE seconds
    const waves = [];
    for (let k = Math.floor(t / EMIT); k * EMIT > t - AGE; k--) {
      const te = k * EMIT;
      waves.push([srcX(te), (t - te) * C, (t - te) / AGE]);
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      let ink = null;
      if (y < 22) {
        const py = (y + 0.5 - SY) * 2;
        for (const [wx, r, age] of waves) {
          const d = Math.hypot(x + 0.5 - wx, py);
          if (Math.abs(d - r) < 0.75) { ink = age; break; }
        }
      }
      if (y >= 22) {
        if (y === 22) g.set(x, y, "▀", K("grass", 1));
        else if (y === 25) g.set(x, y, x % 6 < 3 ? "━" : " ", K("road", 2));
        else g.set(x, y, v > 0.5 ? "▓" : "▒", K("road", y > 27 ? 0 : 1));
      } else if (ink !== null) g.set(x, y, "█", K("ring", clamp(Math.floor((1 - ink) * 5), 0, 4)));
      else g.set(x, y, v > 0.6 ? "▒" : "░", K("sky", Math.min(3, Math.floor(v * 4))));
    }
    // the siren car
    const sx = Math.round(srcX(t));
    const flash = Math.floor(t * 6) & 1;
    g.text(sx - 4, 19, " ▄▄█▄▄ ", K("car", 0));
    g.set(sx - 1, 19, "█", K("car", flash ? 1 : 2)); g.set(sx + 1, 19, "█", K("car", flash ? 2 : 1));
    g.text(sx - 5, 20, "▐███████▌", K("car", 0));
    g.text(sx - 4, 21, "●     ●", K("car", 3));
    g.text(sx - 2, 18, "→", K("ui", 0));
    // listeners at both ends
    const person = (x, co) => { g.set(x, 18, "●", co); g.set(x, 19, "█", co); g.set(x, 20, "▌", co); g.set(x + 1, 20, "▐", co); g.set(x, 21, "▘", co); };
    person(2, K("lo", 1)); person(96, K("hi", 1));
    // readouts
    g.fill(0, 0, 51, 4, " "); g.fill(0, 8, 18, 6, " "); g.fill(cols - 16, 8, 16, 6, " ");
    g.text(1, 1, "THE DOPPLER EFFECT", K("ui", 0));
    g.text(1, 2, `siren ${F} Hz, moving at 0.4 x the speed of sound`, K("ui", 1));
    g.text(1, 9, "BEHIND", K("lo", 1));
    g.text(1, 10, `hears ${FL} Hz`, K("lo", 1));
    g.text(1, 11, "lower pitch", K("lo", 0));
    g.text(1, 12, "waves spread out", K("lo", 0));
    const ahead = ["AHEAD", `hears ${FH} Hz`, "higher pitch", "waves bunch up"];
    ahead.forEach((s, i) => g.text(cols - 1 - s.length, 9 + i, s, K("hi", i < 2 ? 1 : 0)));
    g.text(1, 27, `f(ahead) = f x c / (c - v) = ${F} / 0.6 = ${FH} Hz`, K("ui", 0));
    g.text(1, 28, `f(behind) = f x c / (c + v) = ${F} / 1.4 = ${FL} Hz`, K("ui", 0));
    return g.frame();
  };
}
