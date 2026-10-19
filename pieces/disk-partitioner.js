/* disk-partitioner: a curses-style partition editor creating, sizing, writing and formatting a new partition. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "disk-partitioner",
  name: "Partition Editor",
  category: "screens",
  note: "A curses-style partition editor that carves a new partition out of free space, writes the table and formats it.",
  tags: ["disk", "partition", "terminal", "system", "linux", "storage"],
  cols: 82, rows: 27, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const BASE = [
  ["/dev/sda1", 2048, "1G", "EFI System", "3"],
  ["/dev/sda2", 2099200, "64G", "Linux filesystem", "6"],
  ["/dev/sda3", 136317952, "16G", "Linux swap", "4"],
];
const DISK = 476.9; // GiB
const PERIOD = 16;
const MENU = ["New", "Delete", "Resize", "Type", "Write", "Quit"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.text(Math.floor(W / 2) - 12, 0, "Disk: /dev/sda", "0");
    g.text(Math.floor(W / 2) - 25, 1, "Size: 476.94 GiB, 512110190592 bytes, 1000215216 sectors", "1");
    g.text(Math.floor(W / 2) - 25, 2, "Label: gpt, identifier: 4A1F2C0E-77D3-4B9A-9E21-0C6B5D7F31AA", "1");
    // states
    const typed = "320G";
    const sizeTyping = lt >= 2.4 && lt < 4.4;
    const nTyped = Math.max(0, Math.min(typed.length, Math.floor((lt - 2.8) / 0.25)));
    const created = lt >= 4.4;
    const written = lt >= 8.4;
    const fmt = Math.max(0, Math.min(1, (lt - 9.6) / 3.6));
    const rows = BASE.map((r) => r.slice());
    if (created) rows.push(["/dev/sda4", 169872384, "320G", lt >= 6.0 ? "Linux filesystem" : "Linux filesystem", "2"]);
    const usedG = 81 + (created ? 320 : 0);
    const free = (DISK - usedG).toFixed(1) + "G";
    // cursor: 0..3 rows, 4 = free
    let cur = rows.length;
    if (lt < 0.8) cur = 0; else if (lt < 1.4) cur = 2;
    if (created) cur = 3;
    if (lt >= 14.6) cur = 0;
    g.text(4, 4, "Device".padEnd(14) + "Start".padStart(12) + "End".padStart(12) + "Sectors".padStart(12) + "Size".padStart(7) + "  Type", "0");
    let y = 5;
    const all = [...rows, ["Free space", 0, free, "", "7"]];
    all.forEach((r, i) => {
      const sel = i === cur;
      const start = r[1];
      const sectors = r[2].endsWith("G") ? Math.round(parseFloat(r[2]) * 2097152) : 0;
      if (sel) { g.set(2, y, ">>", "9"); g.text(1, y, ">>", "9"); }
      const name = i === all.length - 1 ? "  Free space" : r[0];
      let line = name.padEnd(14);
      line += (start ? String(start) : String(169872384 + (created ? 671088640 : 0))).padStart(12);
      line += (start ? String(start + sectors - 1) : "1000215182").padStart(12);
      line += String(sectors || Math.round(parseFloat(free) * 2097152)).padStart(12);
      line += r[2].padStart(7) + "  " + r[3];
      const fresh = i === 3 && created && lt < 6.2;
      g.text(4, y, line, sel ? "0" : fresh ? "2" : i === all.length - 1 ? "7" : "1");
      if (sel) g.fill(4 + line.length, y, Math.max(0, 76 - line.length), 1, " ");
      y++;
    });
    // partition map bar
    const BX = 4, BW = W - 8, BY = 12;
    g.text(BX, BY - 1, "Layout", "1");
    g.box(BX - 1, BY, BW + 2, 3, "light", "7");
    let bx = BX;
    const segs = [...rows.map((r) => [parseFloat(r[2]), r[4], r[0].slice(5)]), [DISK - usedG, "8", "free"]];
    segs.forEach(([sz, c, lab], i) => {
      let w = Math.max(2, Math.round((sz / DISK) * BW));
      if (i === segs.length - 1) w = BX + BW - bx;
      g.fill(bx, BY + 1, w, 1, c === "8" ? "░" : "█", c);
      if (w > lab.length + 2) g.text(bx + 1, BY + 3, lab, c === "8" ? "7" : c);
      bx += w;
    });
    // detail line
    const dl = all[cur];
    g.hline(0, W - 1, 17, "─", "8");
    g.text(2, 18, "Partition type: ", "1"); g.text(18, 18, dl[3] || "unallocated", "a");
    g.text(2, 19, "Filesystem: ", "1"); g.text(18, 19, i4fs(cur, fmt, dl), "0");
    // menu
    const act = created ? (written ? 4 : lt >= 7.2 ? 4 : 3) : 0;
    let mx = 6;
    MENU.forEach((m, i) => {
      const s = "[" + m + "]";
      g.text(mx, 21, s, i === act ? "9" : "3");
      if (i === act) g.text(mx - 1, 21, "▐", "9"), g.text(mx + s.length, 21, "▌", "9");
      mx += s.length + 4;
    });
    // prompts / messages
    let msg = "", mc = "1";
    if (lt < 2.4) msg = "Create new partition from free space";
    else if (sizeTyping) {
      g.text(4, 23, "Partition size: ", "0");
      g.text(20, 23, typed.slice(0, nTyped), "9");
      if (Math.floor(lt * 3) % 2 === 0) g.set(20 + nTyped, 23, "█", "0");
      msg = "May be followed by M for MiB, G for GiB, T for TiB, or S for sectors.";
    } else if (lt < 7.2) msg = "Created a new partition 4 of type 'Linux filesystem' and of size 320 GiB.", mc = "2";
    else if (lt < 8.4) {
      g.text(4, 23, "Are you sure you want to write the partition table to disk? ", "0");
      const yes = "yes".slice(0, Math.max(0, Math.floor((lt - 7.6) / 0.2)));
      g.text(64, 23, yes, "9");
    } else if (lt < 9.6) msg = "The partition table has been altered. Syncing disks.", mc = "2";
    else if (fmt < 1) {
      g.text(4, 23, "mkfs /dev/sda4  writing inode tables:", "0");
      const n = Math.round(fmt * 2560);
      g.text(42, 23, `${n}/2560`, "9");
      const bw = 30, k = Math.round(fmt * bw);
      g.text(4, 24, "█".repeat(k), "2"); g.text(4 + k, 24, "░".repeat(bw - k), "8");
    } else msg = "Filesystem UUID 9c3e1a5b ready. Mounted at /srv/data.", mc = "2";
    if (msg) g.text(4, 24, msg, mc);
    g.text(2, H - 1, "↑↓ select   ←→ menu   Enter confirm", "7");
    return g.frame();
  };
  function i4fs(cur, fmt, dl) {
    if (cur === 0) return "vfat   /boot/efi";
    if (cur === 1) return "ext4   /";
    if (cur === 2) return "swap";
    if (cur === 3 && dl[0] === "/dev/sda4") return fmt >= 1 ? "ext4   /srv/data" : fmt > 0 ? "formatting..." : "none";
    return dl[2] + " unallocated";
  }
}
