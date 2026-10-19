/* sequence-diagram: participants with lifelines and a login flow's messages appearing in order. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "sequence-diagram",
  name: "Sequence Diagram",
  category: "explainers",
  note: "A login sequence diagram where requests and dashed replies draw across the lifelines one after another.",
  tags: ["sequence", "uml", "diagram", "api", "docs"],
  cols: 84, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#ffffff", "#56d4dd", "#484f58"]),
};

const PARTS = [["Browser", "3"], ["API", "6"], ["Auth", "5"], ["Database", "8"]];
const MSGS = [
  [0, 1, "POST /login", false], [1, 2, "verify(email, pw)", false], [2, 3, "SELECT * FROM users", false],
  [3, 2, "user row", true], [2, 2, "check hash", false], [2, 1, "jwt token", true], [1, 3, "INSERT session", false],
  [3, 1, "ok", true], [1, 0, "200 OK, set-cookie", true],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const PX = [10, 31, 52, 73];
  const STEP = 1.1, LOOP = MSGS.length * STEP + 2.5;
  const part = (x, y, name, co, on) => {
    const w = name.length + 4;
    g.box(x - Math.floor(w / 2), y, w, 3, on ? "heavy" : "light", on ? co : "1");
    g.text(x - Math.floor(w / 2) + 2, y + 1, name, "0");
  };
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const cur = Math.min(MSGS.length - 1, Math.floor(lt / STEP));
    const p = clamp((lt - cur * STEP) / 0.55);
    const done = lt > MSGS.length * STEP;
    const [af, at] = MSGS[cur];
    // lifelines
    PX.forEach((x, i) => {
      const on = !done && (i === af || i === at);
      for (let y = 3; y < rows - 3; y++) g.set(x, y, on ? "┃" : "┆", on ? PARTS[i][1] : "2");
    });
    PX.forEach((x, i) => { const on = !done && (i === af || i === at); part(x, 0, PARTS[i][0], PARTS[i][1], on); part(x, rows - 3, PARTS[i][0], PARTS[i][1], false); });
    for (let i = 0; i <= cur; i++) {
      const [f, to, label, dash] = MSGS[i];
      const y = 4 + i * 2;
      const active = i === cur && !done;
      const prog = i < cur || done ? 1 : p;
      const co = active ? "5" : dash ? "1" : "0";
      if (f === to) {
        // self call: a small loop to the right
        const x = PX[f];
        if (prog > 0.3) { g.text(x + 1, y, "──╮", co); g.text(x + 1, y + 1, "◀─╯", co); }
        g.text(x + 5, y, label, active ? "7" : "1");
        continue;
      }
      const x0 = PX[f], x1 = PX[to], dir = Math.sign(x1 - x0);
      const len = Math.abs(x1 - x0) - 1;
      const n = Math.round(len * prog);
      for (let k = 1; k <= n; k++) {
        const x = x0 + dir * k;
        g.set(x, y, dash ? "╌" : "─", co);
      }
      if (n >= 1) g.set(x0 + dir * n, y, dir > 0 ? "▶" : "◀", co);
      if (prog > 0.5) {
        const lx = Math.min(x0, x1) + Math.floor((Math.abs(x1 - x0) - label.length) / 2) + 1;
        g.text(lx, y - 1, label, active ? "7" : dash ? "1" : "0");
      }
      g.text(0, y, String(i + 1).padStart(2), active ? "5" : "9");
    }
    return g.frame();
  };
}
