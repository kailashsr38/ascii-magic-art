/* tcp-handshake: a ladder diagram of a TCP connection, three-way handshake, data and teardown, with socket states. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "tcp-handshake",
  name: "TCP Handshake Ladder",
  category: "explainers",
  note: "A packet ladder diagram where SYN, SYN-ACK and ACK step down between client and server, followed by a request, its reply and the four-way close, with each socket state logged as it changes.",
  tags: ["tcp", "networking", "handshake", "diagram", "protocol", "docs"],
  cols: 100, rows: 39, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

// dir (+1 client->server), label, client state, server state, phase
const MSGS = [
  [1, "SYN  seq=1000", "SYN_SENT", "SYN_RCVD", 0],
  [-1, "SYN+ACK  seq=5000 ack=1001", "ESTABLISHED", "", 0],
  [1, "ACK  ack=5001", "", "ESTABLISHED", 0],
  [1, "PSH  len=420  GET /index", "", "", 1],
  [-1, "ACK+PSH  len=1380  200 OK", "", "", 1],
  [1, "ACK  ack=6381", "", "", 1],
  [1, "FIN  seq=1421", "FIN_WAIT_1", "CLOSE_WAIT", 2],
  [-1, "ACK  ack=1422", "FIN_WAIT_2", "", 2],
  [-1, "FIN  seq=6381", "", "LAST_ACK", 2],
  [1, "ACK  ack=6382", "TIME_WAIT", "CLOSED", 2],
];
const PHASES = [["handshake", "3"], ["data", "4"], ["close", "5"]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CX = 24, SX = 74, Y0 = 6, DY = 3;
  const N = MSGS.length, STEP = 1.35, TRAVEL = 0.9, LOOP = N * STEP + 3.5;
  const mid = (CX + SX) >> 1;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const cur = Math.min(N, Math.floor(lt / STEP));
    // header boxes
    g.box(CX - 11, 0, 23, 4, "round", "3");
    g.text(CX - 9, 1, "client", "0");
    g.text(CX - 9, 2, "10.0.0.5:51344", "1");
    g.box(SX - 11, 0, 23, 4, "round", "7");
    g.text(SX - 9, 1, "server", "0");
    g.text(SX - 9, 2, "10.0.0.9:443", "1");
    g.set(CX, 3, "┬", "3"); g.set(SX, 3, "┬", "7");
    g.vline(CX, 4, rows - 3, "│", "b");
    g.vline(SX, 4, rows - 3, "│", "b");
    g.text(1, 4, "state", "b"); g.text(SX + 3, 4, "state", "b");
    // current states (final) as a footer
    let cs = "CLOSED", ss = "LISTEN";
    for (let i = 0; i < N; i++) {
      const y = Y0 + i * DY;
      const [dir, label, cst, sst, ph] = MSGS[i];
      if (i > cur) break;
      const started = i < cur ? 1 : clamp((lt - i * STEP) / TRAVEL);
      if (i === cur && lt - i * STEP < 0) continue;
      const pc = PHASES[ph][1];
      const active = i === cur;
      const xa = dir > 0 ? CX : SX, xb = dir > 0 ? SX : CX;
      const span = Math.abs(xb - xa) - 1;
      const n = Math.round(started * span);
      for (let k = 1; k <= n; k++) {
        const x = xa + dir * k;
        let ch, yy;
        if (dir > 0) {
          if (x < mid) { ch = "─"; yy = y + 1; } else if (x === mid) { g.set(x, y + 1, "╮", pc); ch = "╰"; yy = y + 2; } else { ch = "─"; yy = y + 2; }
        } else {
          if (x > mid) { ch = "─"; yy = y + 1; } else if (x === mid) { g.set(x, y + 1, "╭", pc); ch = "╯"; yy = y + 2; } else { ch = "─"; yy = y + 2; }
        }
        g.set(x, yy, ch, active ? pc : "1");
        if (k === n && started < 1) g.set(x, yy, "●", "8");
      }
      if (started >= 1) g.set(xb - dir, y + 2, dir > 0 ? "▶" : "◀", pc);
      // label
      const lx = mid - (label.length >> 1);
      const lit = started > 0.15;
      if (lit) {
        const [kind, ...rest] = label.split("  ");
        g.text(lx, y, kind, active ? "8" : pc);
        g.text(lx + kind.length + 2, y, rest.join("  "), active ? "0" : "1");
      }
      // state changes: sender on send, receiver on arrival
      const sendSt = dir > 0 ? cst : sst, recvSt = dir > 0 ? sst : cst;
      const put = (side, st, yy, on) => {
        if (!st) return;
        if (side === "c") g.text(CX - 2 - st.length, yy, st, on ? "a" : "1");
        else g.text(SX + 3, yy, st, on ? "a" : "1");
      };
      const sendSide = dir > 0 ? "c" : "s", recvSide = dir > 0 ? "s" : "c";
      put(sendSide, sendSt, y + 1, active && started < 1);
      if (sendSt) { if (sendSide === "c") cs = sendSt; else ss = sendSt; }
      if (started >= 1) {
        put(recvSide, recvSt, y + 2, active);
        if (recvSt) { if (recvSide === "c") cs = recvSt; else ss = recvSt; }
        g.set(xb, y + 2, "┤", pc);
        if (recvSide === "c") g.set(xb, y + 2, "├", pc);
      }
      g.set(xa, y + 1, dir > 0 ? "├" : "┤", pc);
    }
    // phase brackets
    PHASES.forEach(([name, co], p) => {
      const ids = MSGS.map((m, i) => (m[4] === p ? i : -1)).filter((i) => i >= 0);
      const first = ids[0], last = ids[ids.length - 1];
      if (first > cur) return;
      const y0 = Y0 + first * DY, y1 = Y0 + Math.min(last, cur) * DY + 2;
      g.vline(89, y0, y1, "│", co);
      g.set(89, y0, "┐", co); g.set(89, y1, last <= cur ? "┘" : "│", co);
      g.text(91, y0, name, co);
    });
    // footer
    const fy = rows - 2;
    g.hline(0, cols - 1, fy, "─", "2");
    g.text(1, rows - 1, "client", "1"); g.text(8, rows - 1, cs.padEnd(12), cs === "ESTABLISHED" ? "4" : "0");
    g.text(23, rows - 1, "server", "1"); g.text(30, rows - 1, ss.padEnd(12), ss === "ESTABLISHED" ? "4" : "0");
    const rtt = 18 + ((cur * 7) % 5);
    g.text(46, rows - 1, "rtt " + rtt + " ms   window 64 KiB   mss 1460", "b");
    return g.frame();
  };
}
