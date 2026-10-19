/* syntax-highlight-pass: code typed into an editor as plain text, then the language is detected and colour sweeps down line by line. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "syntax-highlight-pass",
  name: "Syntax Highlight Pass",
  category: "lettering",
  note: "Code is typed into an editor as plain grey text, then the language is detected and syntax colour sweeps down the file line by line.",
  tags: ["code", "editor", "syntax", "typing", "terminal", "developer"],
  cols: 80, rows: 19, fps: 30,
  // 0 plain, 1 muted, 2 frame, 3 keyword, 4 string, 5 comment, 6 number, 7 function, 8 text, 9 cursor, a sweep, b gutter current
  palette: palette(["#8b949e", "#6e7681", "#30363d", "#ff7b72", "#a5d6ff", "#8b949e", "#79c0ff", "#d2a8ff", "#e6edf3", "#7ee787", "#ffa657", "#e6edf3"]),
};

const SNIPS = [
  { name: "orbit.py", lang: "Python", kw: ["import", "def", "for", "in", "return", "range", "print"], cm: "#", src: `import math

def orbit(radius, steps=12):
    """Points on a circle, one per step."""
    pts = []
    for i in range(steps):
        a = 2 * math.pi * i / steps
        pts.append((radius * math.cos(a), radius * math.sin(a)))
    return pts

# print a dozen points
for x, y in orbit(4.0):
    print(f"{x:6.2f} {y:6.2f}")` },
  { name: "debounce.js", lang: "JavaScript", kw: ["export", "function", "let", "const", "return", "null", "new"], cm: "//", src: `// debounce: wait for a quiet moment
export function debounce(fn, ms = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

const save = debounce(() => console.log("saved"), 500);
window.addEventListener("input", save);` },
];

// colour every character of a line
function tokenize(line, S) {
  const out = new Array(line.length).fill("8");
  const ci = line.indexOf(S.cm);
  let end = line.length;
  // a comment marker outside a string starts a comment
  if (ci >= 0 && !/["']/.test(line.slice(0, ci))) { for (let i = ci; i < line.length; i++) out[i] = "5"; end = ci; }
  let i = 0;
  while (i < end) {
    const c = line[i];
    if (c === '"' || c === "'") {
      const q = line.startsWith('"""', i) ? '"""' : c;
      let j = line.indexOf(q, i + q.length);
      j = j < 0 ? end : j + q.length;
      for (let k = i; k < j; k++) out[k] = "4";
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i; while (j < end && /[A-Za-z0-9_]/.test(line[j])) j++;
      const w = line.slice(i, j);
      const col = S.kw.includes(w) ? "3" : line[j] === "(" ? "7" : "8";
      for (let k = i; k < j; k++) out[k] = col;
      i = j; continue;
    }
    if (/[0-9]/.test(c)) { let j = i; while (j < end && /[0-9.]/.test(line[j])) j++; for (let k = i; k < j; k++) out[k] = "6"; i = j; continue; }
    if (/[=+\-*/<>]/.test(c)) out[i] = "3";
    i++;
  }
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(3);
  const plans = SNIPS.map((S) => {
    const lines = S.src.split("\n");
    const toks = lines.map((l) => tokenize(l, S));
    // typing times: indentation arrives at once (auto-indent), other keys at a human pace
    const times = lines.map(() => []);
    let tt = 0.4;
    const starts = [];
    lines.forEach((l, li) => {
      starts.push(tt);
      const ind = l.length - l.trimStart().length;
      for (let k = 0; k < l.length; k++) {
        if (k >= ind) tt += 0.02 + r() * 0.03 + (l[k] === " " ? 0.015 : 0);
        times[li].push(tt);
      }
      tt += 0.12;
    });
    const typed = tt, detect = typed + 0.6, sweep0 = detect + 0.7, sweep = 0.09 * lines.length;
    return { S, lines, toks, times, starts, typed, detect, sweep0, sweepEnd: sweep0 + sweep, dur: sweep0 + sweep + 3.2 };
  });
  const total = plans.reduce((a, p) => a + p.dur, 0);
  return (t) => {
    g.clear();
    let lt = ((t % total) + total) % total, pi = 0;
    while (lt >= plans[pi].dur) { lt -= plans[pi].dur; pi++; }
    const P = plans[pi];
    const highlighted = lt >= P.sweep0;
    // window chrome
    g.box(0, 0, cols, rows, "round", "2");
    g.text(2, 1, "●", "3"); g.text(4, 1, "●", "a"); g.text(6, 1, "●", "9");
    const dirty = lt < P.typed + 0.3;
    g.text(10, 1, P.S.name + (dirty ? " ●" : ""), "8");
    g.hline(1, cols - 2, 2, "─", "2");
    // code
    const Y0 = 3, GX = 6;
    let cl = 0, cc = 0;
    P.lines.forEach((l, li) => {
      const y = Y0 + li;
      let n = 0;
      while (n < l.length && P.times[li][n] <= lt) n++;
      if (li > 0 && lt < P.starts[li]) return;
      cl = li; cc = n;
      g.text(1, y, String(li + 1).padStart(3), "1");
      const lineLit = highlighted && lt >= P.sweep0 + li * 0.09;
      for (let k = 0; k < n; k++) g.set(GX + k, y, l[k], lineLit ? P.toks[li][k] : "0");
    });
    g.text(1, Y0 + cl, String(cl + 1).padStart(3), "b");
    // sweep marker in the gutter
    if (highlighted && lt < P.sweepEnd) {
      const sl = Math.floor((lt - P.sweep0) / 0.09);
      if (sl < P.lines.length) g.text(GX - 2, Y0 + sl, "▶", "a");
    }
    // cursor
    if (lt < P.typed + 0.2 || (lt % 1) < 0.55) g.set(GX + cc, Y0 + cl, "▌", "9");
    // status bar
    const sy = rows - 2;
    g.hline(1, cols - 2, sy - 1, "─", "2");
    let mode;
    if (lt < P.typed) mode = ["-- INSERT --", "9"];
    else if (lt < P.detect) mode = ["saved", "1"];
    else if (lt < P.sweep0) mode = ["detecting language...", "a"];
    else if (lt < P.sweepEnd) mode = ["highlighting " + P.S.lang + "...", "a"];
    else mode = ["ready", "9"];
    g.text(2, sy, mode[0], mode[1]);
    const lang = lt < P.sweep0 ? "Plain Text" : P.S.lang;
    const info = `Ln ${cl + 1}, Col ${cc + 1}   UTF-8   ${lang}`;
    g.text(cols - 2 - info.length, sy, info, "1");
    if (lt >= P.sweep0) g.text(cols - 2 - lang.length, sy, lang, "6");
    return g.frame();
  };
}
