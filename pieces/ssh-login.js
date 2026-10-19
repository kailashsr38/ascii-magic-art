/* ssh-login: a secure shell login with host key prompt, welcome banner and a couple of commands. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "ssh-login",
  name: "Secure Shell Login",
  category: "screens",
  note: "A remote shell session that accepts a host key, prints a welcome banner with system stats, runs two commands and logs out.",
  tags: ["ssh", "terminal", "server", "linux", "login", "cli"],
  cols: 82, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const LOCAL = [["kai@laptop", "2"], [" ~ ", "3"], ["% ", "0"]];
const REMOTE = [["deploy@build-07", "2"], [":", "0"], ["~", "3"], ["$ ", "0"]];
const TYPE = 0.045;

function buildScript() {
  // each step: { at, kind: "type"|"out", prompt, text|segs }
  const S = [];
  let tt = 0.3;
  const type = (prompt, text, pause = 0.5) => { S.push({ at: tt, kind: "type", prompt, text }); tt += text.length * TYPE + pause; };
  const out = (segs, dt = 0.05) => { S.push({ at: tt, kind: "out", segs }); tt += dt; };
  type(LOCAL, "ssh deploy@build-07.lab", 0.6);
  out([["The authenticity of host 'build-07.lab (10.0.0.42)' can't be established.", "0"]]);
  out([["ED25519 key fingerprint is SHA256:q3Vf9Lx0bWZt1kH8nR2aPj7sY4cE6uDmT5oQ.", "1"]]);
  out([["Are you sure you want to continue connecting (yes/no)? ", "0"]], 0.4);
  S[S.length - 1].ask = true;
  S.push({ at: tt, kind: "answer", text: "yes" }); tt += 3 * TYPE + 0.5;
  out([["Warning: ", "9"], ["Permanently added 'build-07.lab' to the list of known hosts.", "1"]], 0.6);
  out([["deploy@build-07.lab's password: ", "0"]], 1.1);
  out([[""]], 0.25);
  const box = (segs) => {
    const len = segs.reduce((n, x) => n + x[0].length, 0);
    return [["  │ ", "7"], ...segs, [" ".repeat(Math.max(0, 57 - len)) + "│", "7"]];
  };
  const ban = [
    [["  ┌" + "─".repeat(58) + "┐", "7"]],
    box([["build-07", "2"], ["  ·  LTS server 12  ·  kernel 6.8.0-45-generic", "1"]]),
    box([]),
    box([["System load:", "1"], ["  0.42            ", "0"], ["Processes:", "1"], ["   231", "0"]]),
    box([["Usage of /:", "1"], ["   38.1% of 469G   ", "0"], ["Users:", "1"], ["       1", "0"]]),
    box([["Memory:", "1"], ["       21%             ", "0"], ["IPv4 eth0:", "1"], [" 10.0.0.42", "0"]]),
    box([["Updates:", "1"], ["      ", "0"], ["4 security updates available", "9"]]),
    [["  └" + "─".repeat(58) + "┘", "7"]],
  ];
  for (const b of ban) out(b, 0.06);
  out([["Last login: Fri Oct 17 18:02:11 2026 from 10.0.0.12", "1"]], 0.6);
  type(REMOTE, "uptime", 0.3);
  out([[" 09:41:07 up 12 days,  4:18,  1 user,  load average: 0.42, 0.37, 0.31", "0"]], 0.7);
  type(REMOTE, "df -h /srv", 0.3);
  out([["Filesystem      Size  Used Avail Use% Mounted on", "1"]]);
  out([["/dev/nvme0n1p4  320G  118G  186G  ", "0"], ["39%", "2"], [" /srv", "0"]], 0.9);
  type(REMOTE, "exit", 0.3);
  out([["logout", "0"]]);
  out([["Connection to build-07.lab closed.", "1"]], 2.4);
  return [S, tt];
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const [S, PERIOD] = buildScript();
  const VIS = H - 3;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const lines = [];
    let cursor = null;
    for (const s of S) {
      if (s.at > lt) break;
      if (s.kind === "type") {
        const n = Math.min(s.text.length, Math.floor((lt - s.at) / TYPE));
        lines.push([...s.prompt, [s.text.slice(0, n), "0"]]);
        cursor = n < s.text.length || s === S[S.length - 1] ? lines.length - 1 : cursor;
      } else if (s.kind === "answer") {
        const n = Math.min(3, Math.floor((lt - s.at) / TYPE));
        lines[lines.length - 1] = [...lines[lines.length - 1], [s.text.slice(0, n), "9"]];
      } else lines.push(s.segs);
    }
    const last = lines.length - 1;
    const start = Math.max(0, lines.length - VIS);
    g.box(0, 0, W, H, "round", "7");
    const remote = lines.some((l) => l[0] && l[0][0] === "deploy@build-07") && !lines.some((l) => l[0] && l[0][0].startsWith("Connection to"));
    g.text(2, 0, remote ? " deploy@build-07: ~ (ssh) " : " kai@laptop: ~ ", "1");
    lines.slice(start).forEach((segs, i) => {
      let x = 2;
      for (const [s, c] of segs) { g.text(x, 1 + i, s, c); x += s.length; }
      if (start + i === last && Math.floor(lt * 2.5) % 2 === 0) g.set(x, 1 + i, "█", "0");
    });
    void cursor;
    return g.frame();
  };
}
