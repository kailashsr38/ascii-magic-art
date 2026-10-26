/* potala-palace-dawn: the white and red palace climbing its hill at dawn, snow peaks behind, hand-built.
 * Painted once: the dawn sky, the snow ranges, the red hill, the white palace's battered walls and rows
 * of windows, the red palace at its heart and the gold roofs on top. Each frame adds strings of prayer
 * flags fluttering across the foreground, drifting cloud and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, HILL = 3, PAL_ = 4;

const base = new Canvas();
base.sky([[0, "#5a7ab8"], [0.5, "#b8a8c8"], [0.8, "#f6c4a8"], [1, "#ffe0c0"]], SKY, 0, 60);
// snow ranges behind, pink in the first light
base.ridge({ base: 0.48, amp: 0.16, f: 3, seed: 4, top: "#fff0ea", bot: "#a8a0c0", depth: 14, m: MTN });
base.ridge({ base: 0.56, amp: 0.08, f: 5, seed: 8, top: "#a898b8", bot: "#7a7098", depth: 10, m: MTN });
// the red hill the palace stands on
base.ridge({ base: 0.72, amp: 0.1, f: 2, seed: 2, top: "#a8705a", bot: "#6a4a42", depth: 20, m: HILL, shape: (u) => Math.exp(-((u - 0.5) ** 2) / 0.08) * 1.4 - 0.2 });
// the white palace: wide, battered walls stepping up, rows of dark trapezoid windows
const tier = (x0, x1, y0, y1, c, cs) => {
  for (let y = y0; y < y1; y++) {
    const batter = (y1 - y) * 0.08; // walls lean inward as they rise
    for (let x = Math.floor(x0 + batter); x < x1 - batter; x++) {
      const n = noise2(x / 2, y / 2, 7) * 0.08;
      base.put(x, y, mix(hex(c), hex(cs), clamp((x - x0) / (x1 - x0) * 0.7 + n)), PAL_);
    }
  }
  // rows of small dark windows, well spaced, wider at the bottom like the real ones
  for (let y = y0 + 3; y < y1 - 3; y += 5) for (let x = Math.floor(x0 + 5); x < x1 - 5; x += 7) { base.rect(x, y, x + 2, y + 2, "#4a3030", PAL_); base.rect(x - 1, y + 2, x + 3, y + 3, "#4a3030", PAL_); }
};
tier(30, 166, 62, 80, "#fffaf2", "#c8bcc0");
tier(46, 150, 46, 62, "#fffaf2", "#c8bcc0");
tier(80, 118, 30, 48, "#ffb09a", "#e07060"); // the red palace at the heart (light coral: red is dark in halftone)
base.rect(80, 28, 118, 31, "#8a4a32", PAL_);
for (const [x, w] of [[84, 8], [96, 10], [109, 7]]) { // gold roofs and finials
  base.poly([[x - 1, 28], [x + w + 1, 28], [x + w - 1, 24], [x + 1, 24]], (xx) => mix(hex("#ffe08a"), hex("#b8862a"), clamp((xx - x) / w)), PAL_);
  base.rect(x + w / 2, 20, x + w / 2 + 1, 24, "#ffd060", PAL_);
}
base.rect(28, 80, 168, 84, "#e8dccc", PAL_);
// the town and trees at the foot
for (let x = 0; x < W; x++) for (let y = 84; y < H; y++) {
  const n = fbm(x / 4, y / 3, 3, 11);
  base.put(x, y, n > 0.55 ? mix(hex("#4a6a3a"), hex("#2e4a2a"), n) : mix(hex("#c8b8a0"), hex("#8a7a6a"), (y - 84) / 24), HILL);
}

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#2a6ad8", "#f4f4f4", "#d83a3a", "#3aa85a", "#f8d040", "#1e1a24"] });

export const meta = {
  slug: "potala-palace-dawn",
  name: "Potala Palace Dawn",
  category: "cities",
  note: "The white and red palace climbs its hill at dawn below pink snow peaks while strings of prayer flags flutter across the foreground.",
  tags: ["lhasa", "tibet", "palace", "prayer-flags", "dawn", "landmark", "halftone", "mountains"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const FLAGS = ["#2a6ad8", "#f4f4f4", "#d83a3a", "#3aa85a", "#f8d040"];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.3, 0.14, 1.2, "#ffe4d8", 0.4], [0.75, 0.24, 0.26, 1, "#d8c0d8", 0.35]], SKY, 0.75);
    // two strings of prayer flags sagging across the foreground, each flag fluttering
    for (const [x0, y0, x1, y1, sag] of [[-4, 88, 120, 96, 7], [70, 98, 200, 90, 6]]) {
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * sag;
        f.put(x, y, "#5a4a3a");
        if (i === n) continue;
        const c = FLAGS[i % 5], flut = Math.sin(t * 5 + i * 0.9);
        for (let dy = 1; dy <= 4; dy++) for (let dx = 0; dx < 4; dx++) f.put(x + dx + Math.round(flut * (dy / 4) * 1.2), y + dy, c);
      }
    }
    birds(f, t, { n: 5, y: 16, period: 18, c: "#1e1a24", only: SKY });
    return enc(f);
  };
}
