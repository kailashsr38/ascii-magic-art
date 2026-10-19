/* boot-sequence: an OS boot log scrolling with status tags, then a login prompt. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "boot-sequence",
  name: "Boot Sequence",
  category: "screens",
  note: "A system boot log scrolls past with green OK tags, then the machine waits at a login prompt.",
  tags: ["terminal", "boot", "linux", "server", "hero", "retro"],
  cols: 80, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58"]),
};

const K = [
  "kernel: version 6.8.0-orbit (gcc 13.2.0) #1 SMP PREEMPT",
  "Command line: root=/dev/nvme0n1p2 ro quiet splash",
  "BIOS-e820: [mem 0x0000000000100000-0x00000000bfffffff] usable",
  "smpboot: Allowing 16 CPUs, 0 hotplug CPUs",
  "Memory: 32611204K/33452032K available",
  "ACPI: Core revision 20230628",
  "nvme nvme0: 8/0/0 default/read/poll queues",
  " nvme0n1: p1 p2 p3",
  "EXT4-fs (nvme0n1p2): mounted filesystem with ordered data mode",
];
const U = [
  ["OK", "Reached target Local File Systems."],
  ["OK", "Started Journal Service."],
  ["OK", "Started Load Kernel Modules."],
  ["..", "Starting Network Manager..."],
  ["OK", "Started Network Manager."],
  ["OK", "Reached target Network."],
  ["..", "Starting OpenSSH server daemon..."],
  ["OK", "Started OpenSSH server daemon."],
  ["OK", "Started Daily apt download activities."],
  ["WARN", "thermald: cpu0 running above 85C, throttling"],
  ["OK", "Started Docker Application Container Engine."],
  ["OK", "Started PostgreSQL 16 database server."],
  ["OK", "Started Redis in-memory data store."],
  ["..", "Starting Time & Date Service..."],
  ["OK", "Started Time & Date Service."],
  ["OK", "Mounted /srv/data."],
  ["OK", "Started Periodic Command Scheduler."],
  ["OK", "Started User Login Management."],
  ["OK", "Reached target Multi-User System."],
  ["OK", "Reached target Graphical Interface."],
];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const r = rng(42);
  const lines = []; // [time, segments]
  let tt = 0, ts = 0;
  for (const k of K) {
    ts += 0.03 + r() * 0.4;
    lines.push([tt, [["[" + ts.toFixed(6).padStart(12) + "] ", "7"], [k, "1"]]]);
    tt += lines.length < 4 ? 0 : 0.08 + r() * 0.12;
  }
  tt += 0.4;
  for (const [s, m] of U) {
    const tag = s === "OK" ? [["[  ", "0"], ["OK", "2"], ["  ] ", "0"]]
      : s === "WARN" ? [["[ ", "0"], ["WARN", "4"], [" ] ", "0"]] : [["         ", "0"]];
    lines.push([tt, [...tag, [m, s === ".." ? "1" : "0"]]]);
    tt += 0.12 + r() * 0.28;
  }
  const BOOT_END = tt + 0.8;
  const PERIOD = BOOT_END + 7.5;
  const H = meta.rows;
  const segs = (y, list) => { let x = 0; for (const [s, c] of list) { g.text(x, y, s, c); x += s.length; } };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    if (lt < BOOT_END) {
      const vis = lines.filter((l) => l[0] <= lt);
      const start = Math.max(0, vis.length - H);
      for (let i = start; i < vis.length; i++) segs(i - start, vis[i][1]);
      if (vis.length < H && Math.floor(lt * 4) % 2 === 0) g.set(0, vis.length, "_", "0");
      return g.frame();
    }
    const u = lt - BOOT_END;
    segs(1, [["orbit-os 4.2 LTS ", "0"], ["devbox", "3"], [" tty1", "1"]]);
    segs(3, [["devbox login: ", "0"]]);
    const user = "kai";
    const nu = Math.max(0, Math.min(user.length, Math.floor((u - 0.6) / 0.22)));
    g.text(14, 3, user.slice(0, nu), "2");
    let cy = 3, cx = 14 + nu;
    if (u > 1.8) {
      g.text(0, 4, "Password: ", "0");
      cy = 4; cx = 10;
    }
    if (u > 3.2) {
      segs(5, [["Last login: Sat Oct 17 22:14:09 2026 from 10.0.4.12", "1"]]);
      segs(7, [["  System load: ", "1"], ["0.42", "0"], ["     Processes:    ", "1"], ["318", "0"]]);
      segs(8, [["  Usage of /:  ", "1"], ["41.7% of 915GB", "0"], ["  Users logged in: ", "1"], ["1", "0"]]);
      segs(9, [["  Memory usage: ", "1"], ["12%", "0"], ["          IPv4 address: ", "1"], ["10.0.4.27", "0"]]);
      segs(11, [["  ", "0"], ["3 updates", "4"], [" can be applied immediately.", "1"]]);
      segs(13, [["kai@devbox", "2"], [":", "0"], ["~", "3"], ["$ ", "0"]]);
      cy = 13; cx = 14;
    }
    if (Math.floor(u * 2.5) % 2 === 0) g.set(cx, cy, "█", "0");
    return g.frame();
  };
}
