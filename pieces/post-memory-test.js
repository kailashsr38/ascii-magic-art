/* post-memory-test: a power-on self test counting memory, detecting drives and handing off to the boot loader. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "post-memory-test",
  name: "Power-On Memory Count",
  category: "screens",
  note: "A retro power-on self test that counts up memory, detects drives one by one and hands off to the boot loader.",
  tags: ["bios", "boot", "retro", "memory", "terminal", "loader"],
  cols: 80, rows: 26, fps: 24,
  palette: palette(["#c9d1d9", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#f2cc60", "#56d4dd"]),
};

const LOGO = [
  "  ▄▄▄▄▄▄▄▄▄▄  ",
  " █ ▀▀▀▀▀▀▀▀ █ ",
  " █ ████████ █ ",
  " █ ██ ▄▄ ██ █ ",
  " █ ████████ █ ",
  " █▄▄▄▄▄▄▄▄▄▄█ ",
  "  ╹╹╹╹╹╹╹╹╹╹  ",
];
const DRIVES = [
  ["SATA Port 0", "NVMe SSD 1TB      FW 4B2Q", "2"],
  ["SATA Port 1", "HDD 4TB 7200RPM   FW CC54", "2"],
  ["SATA Port 2", "Optical DVD-RW    FW 1.02", "2"],
  ["SATA Port 3", "None", "7"],
  ["USB Device", "Keyboard, Mouse, Flash 32GB", "2"],
];
const TOTAL = 33554432;
const PERIOD = 13;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.block(W - 16, 0, LOGO.join("\n"), "8");
    g.text(W - 16, 7, " SELF TEST v2 ", "1");
    g.text(0, 0, "System Firmware Release 6.00, Low Power Edition", "0");
    g.text(0, 1, "Copyright (C) 1984-2026 Open Firmware Group", "1");
    g.text(0, 3, "Main Processor : x86-64 8-Core @ 3600MHz (100x36.0)", "0");
    const p = Math.min(1, Math.max(0, (lt - 0.8) / 3.6));
    const mem = Math.floor(Math.pow(p, 1.4) * TOTAL / 1024) * 1024;
    g.text(0, 4, "Memory Testing : ", "0");
    g.text(17, 4, (String(mem) + "K").padStart(10), p < 1 ? "8" : "0");
    if (p >= 1) g.text(28, 4, "OK", "2");
    else {
      const bw = 24, n = Math.round(p * bw);
      g.text(32, 4, "█".repeat(n), "3"); g.text(32 + n, 4, "░".repeat(bw - n), "7");
    }
    if (p >= 1) g.text(0, 5, "Memory Frequency 3200 MHz in Dual Channel", "1");
    let y = 7;
    if (lt > 4.8) { g.text(0, y, "Initializing USB Controllers .. ", "0"); if (lt > 5.4) g.text(32, y, "Done.", "2"); }
    y++;
    if (lt > 5.6) g.text(0, y++, "Detecting storage devices ...", "0");
    y++;
    DRIVES.forEach(([port, name, c], i) => {
      const at = 6.0 + i * 0.55;
      if (lt < at) return;
      g.text(2, y, port.padEnd(13), "3");
      g.text(15, y, ": ", "1");
      if (lt < at + 0.4) g.text(17, y, "Detecting" + ".".repeat(1 + (Math.floor(lt * 8) % 3)), "8");
      else g.text(17, y, name, c === "7" ? "7" : "0");
      y++;
    });
    if (lt > 9.0) {
      y++;
      g.text(0, y++, "CMOS checksum ......... OK    Fan 1 ...... 1240 RPM", "1");
      g.text(0, y++, "CPU temperature ........ 41°C  Fan 2 ...... 980 RPM", "1");
    }
    if (lt > 10.0) {
      y++;
      g.text(0, y++, "Verifying DMI Pool Data ..........", "0");
      if (lt > 10.8) g.text(35, y - 1, "Update Success", "2");
    }
    if (lt > 11.2) {
      g.text(0, y++, "Boot from NVMe SSD 1TB ...", "0");
      if (Math.floor(lt * 3) % 2 === 0) g.set(0, y, "_", "0");
    }
    g.hline(0, W - 1, H - 3, "─", "7");
    g.text(0, H - 2, "Press ", "1"); g.text(6, H - 2, "DEL", "0"); g.text(10, H - 2, "to run Setup,  ", "1");
    g.text(25, H - 2, "F8", "0"); g.text(28, H - 2, "for boot menu,  ", "1"); g.text(44, H - 2, "F12", "0"); g.text(48, H - 2, "network boot", "1");
    g.text(0, H - 1, "10/18/2026-X870-8C-6A79 HAOD", "7");
    return g.frame();
  };
}
