/* terminal-session: a shell session where commands are typed and their output streams in. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "terminal-session",
  name: "Terminal Session",
  category: "screens",
  note: "A shell session where commands are typed at a coloured prompt and their output streams back.",
  tags: ["terminal", "shell", "cli", "hero", "readme", "developer"],
  cols: 80, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#a5d6ff", "#f2cc60"]),
};

// "§k" switches colour inside a line
const SESSION = [
  ["git pull --rebase", [
    "remote: Enumerating objects: 23, done.",
    "Unpacking objects: 100% (14/14), 3.81 KiB | 976.00 KiB/s, done.",
    "From git.acme.dev:acme/api-gateway",
    "   §48c1e2f0§0..§4a41d9b3§0  main -> origin/main",
    "Successfully rebased and updated refs/heads/main.",
  ]],
  ["ls", [
    "§3.github§0  §3src§0  §3tests§0  .env.example  package.json  README.md  tsconfig.json",
  ]],
  ["git status -sb", [
    "§2## main§0...§5origin/main§0 [ahead 2]",
    " §4M§0 src/routes/auth.ts",
    " §4M§0 src/middleware/rateLimit.ts",
    "§5??§0 src/routes/billing.ts",
  ]],
  ["npm test", [
    "",
    "§1> api-gateway@1.4.0 test",
    "§1> vitest run",
    "",
    " §2✓§0 tests/auth.test.ts §1(12 tests) 184ms",
    " §2✓§0 tests/users.test.ts §1(8 tests) 96ms",
    " §2✓§0 tests/billing.test.ts §1(5 tests) 141ms",
    "",
    "§1 Test Files  §2§03 passed§1 (3)",
    "§1      Tests  §225 passed§1 (25)",
    "§1   Duration  §01.84s",
    "",
  ]],
  ["curl -s api.lan/health | jq", [
    "{",
    "  §3\"status\"§0: §8\"ok\"§0,",
    "  §3\"uptime\"§0: §44821.3§0,",
    "  §3\"db\"§0: §8\"connected\"§0,",
    "  §3\"version\"§0: §8\"1.4.0\"",
    "}",
  ]],
];
const PROMPT = "§2kai@devbox §3~/projects/api-gateway §6(main) §0$ ";

function parse(s) {
  const ch = [], co = [];
  let c = "0";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "§") { c = s[i + 1]; i++; continue; }
    ch.push(s[i]); co.push(c);
  }
  return { ch, co };
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const r = rng(9);
  const P = parse(PROMPT);
  const L = []; // {t, line, cmd, keyT[]}
  let tt = -5.2;
  for (const [cmd, out] of SESSION) {
    const keyT = [];
    let k = tt + 0.5;
    for (let i = 0; i < cmd.length; i++) { keyT.push(k); k += 0.05 + r() * 0.08; }
    L.push({ t: tt, cmd, keyT });
    tt = k + 0.35;
    for (const o of out) { L.push({ t: tt, line: parse(o) }); tt += 0.07; }
    tt += 0.7;
  }
  L.push({ t: tt, cmd: "", keyT: [] });
  const PERIOD = tt + 2.5;
  const H = meta.rows - 2, W = meta.cols;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, meta.rows, "round", "7");
    g.text(2, 0, "●", "5"); g.text(4, 0, "●", "4"); g.text(6, 0, "●", "2");
    g.text(W / 2 - 14, 0, " kai@devbox: ~/projects/api-gateway ", "1");
    const vis = L.filter((l) => l.t <= lt);
    const start = Math.max(0, vis.length - H);
    let cx = -1, cy = -1;
    for (let i = start; i < vis.length; i++) {
      const l = vis[i], y = 1 + i - start;
      if (l.line) { l.line.ch.forEach((c, j) => g.set(2 + j, y, c, l.line.co[j])); continue; }
      P.ch.forEach((c, j) => g.set(2 + j, y, c, P.co[j]));
      const n = l.keyT.filter((k) => k <= lt).length;
      g.text(2 + P.ch.length, y, l.cmd.slice(0, n), "0");
      if (i === vis.length - 1 || n < l.cmd.length) { cx = 2 + P.ch.length + n; cy = y; }
    }
    if (cy >= 0 && Math.floor(lt * 2.5) % 2 === 0) g.set(cx, cy, "█", "0");
    return g.frame();
  };
}
