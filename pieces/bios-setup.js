/* bios-setup: a firmware setup utility where tabs switch, values change and the boot order is reordered. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "bios-setup",
  name: "Firmware Setup Utility",
  category: "screens",
  note: "A retro firmware setup screen where a cursor walks the tabs, enables a setting, reorders boot devices and saves.",
  tags: ["bios", "retro", "firmware", "boot", "system", "terminal"],
  cols: 88, rows: 23, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#1f6feb", "#f2cc60", "#56d4dd", "#0d419d"]),
};

const TABS = ["Main", "Advanced", "Boot", "Security", "Exit"];
const MAIN = [
  ["System Time", "[{T}]"], ["System Date", "[Sat 10/18/2026]"], ["", ""],
  ["Processor Type", "x86-64 8C/16T @ 3.60GHz"], ["Processor Speed", "3600 MHz"], ["Cache L2/L3", "8192 KB / 32768 KB"],
  ["Total Memory", "32768 MB (DDR4 3200)"], ["", ""], ["SATA Port 0", "[SSD 1TB NVMe]"], ["SATA Port 1", "[HDD 4TB 7200rpm]"], ["SATA Port 2", "[Not Present]"],
];
const ADV = [
  ["CPU Virtualization", "[Disabled]"], ["Hyper-Threading", "[Enabled]"], ["C-State Control", "[Auto]"],
  ["Onboard Audio", "[Enabled]"], ["Onboard LAN", "[Enabled]"], ["Serial Port", "[3F8/IRQ4]"],
  ["USB Legacy Support", "[Enabled]"], ["Fan Profile", "[Balanced]"], ["Wake on LAN", "[Disabled]"],
];
const BOOTDEV = ["USB Flash Drive", "SSD 1TB NVMe", "HDD 4TB 7200rpm", "Network PXE"];
const HELP = {
  0: ["[Enter], [Tab] or", "[Shift-Tab] selects", "a field.", "", "Use [+] or [-] to", "configure the time."],
  1: ["Hardware assisted", "virtualization lets", "a hypervisor run", "guest systems with", "near native speed."],
  2: ["Use [+] and [-] to", "move a device up or", "down the boot list.", "", "The first bootable", "device is used."],
  3: ["Set a supervisor", "password to protect", "these settings."],
  4: ["Exit system setup", "after saving the", "changes to CMOS."],
};
// script: [time, tab, row, extra]
const SCRIPT = [
  [0, 0, 0], [1.2, 0, 1], [1.8, 0, 3], [2.4, 0, 6], [3.0, 1, 0], [3.8, 1, 0, "virt"], [4.4, 1, 1], [5.0, 1, 3], [5.6, 1, 7],
  [6.4, 2, 0], [7.0, 2, 1], [7.6, 2, 1, "up"], [8.4, 2, 2], [9.2, 3, 0], [10.0, 4, 0], [10.8, 4, 0, "dlg"], [12.2, 4, 0, "yes"],
];
const PERIOD = 14;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    let st = SCRIPT[0];
    for (const s of SCRIPT) if (s[0] <= lt) st = s;
    const [, tab, row] = st;
    const virt = lt >= 3.8, up = lt >= 7.6;
    // title
    g.fill(0, 0, W, 1, "▀", "b");
    g.text(Math.floor(W / 2) - 14, 0, " SYSTEM FIRMWARE SETUP UTILITY ", "0");
    let x = 2;
    TABS.forEach((n, i) => {
      if (i === tab) { g.text(x - 1, 1, "▐", "8"); g.text(x, 1, n, "0"); g.text(x + n.length, 1, "▌", "8"); }
      else g.text(x, 1, n, "3");
      x += n.length + 4;
    });
    g.box(0, 2, W, H - 4, "double", "3");
    const RX = 60;
    for (let y = 3; y < H - 3; y++) g.set(RX, y, "║", "3");
    g.set(RX, 2, "╦", "3"); g.set(RX, H - 3, "╩", "3");
    g.text(RX + 3, 3, "Item Specific Help", "a");
    g.hline(RX + 1, W - 2, 4, "─", "7");
    (HELP[tab] || []).forEach((l, i) => g.text(RX + 3, 6 + i, l, "1"));
    const clock = 9 * 3600 + 41 * 60 + Math.floor(t);
    const T = [Math.floor(clock / 3600) % 24, Math.floor(clock / 60) % 60, clock % 60].map((v) => String(v).padStart(2, "0")).join(":");
    let items = [];
    if (tab === 0) items = MAIN.map(([a, b]) => [a, b.replace("{T}", T)]);
    else if (tab === 1) items = ADV.map(([a, b], i) => [a, i === 0 && virt ? "[Enabled]" : b]);
    else if (tab === 2) {
      const order = up ? [1, 0, 2, 3] : [0, 1, 2, 3];
      items = [["Boot Priority Order", ""], ...order.map((k, i) => ["  " + (i + 1) + ". " + BOOTDEV[k], ""]), ["", ""], ["Boot Mode", "[UEFI]"], ["Fast Boot", "[Enabled]"], ["Boot Logo", "[Quiet]"], ["NumLock State", "[On]"]];
    } else if (tab === 3) items = [["Supervisor Password", "Not Installed"], ["User Password", "Not Installed"], ["Secure Boot", "[Enabled]"], ["TPM Device", "[Enabled]"], ["Chassis Intrusion", "[Disabled]"]];
    else items = [["Exit Saving Changes", ""], ["Exit Discarding Changes", ""], ["Load Setup Defaults", ""], ["Discard Changes", ""], ["Save Changes", ""]];
    const selRow = tab === 2 ? row + 1 : row;
    items.forEach(([a, b], i) => {
      const yy = 4 + i;
      const sel = i === selRow;
      if (sel) g.set(2, yy, "►", "9");
      g.text(4, yy, a, a.startsWith("  ") ? (sel ? "0" : "3") : i === 0 && tab === 2 ? "a" : sel ? "0" : "3");
      if (b) {
        const fresh = (tab === 1 && i === 0 && lt >= 3.8 && lt < 4.4) || (tab === 2 && i === 1 && lt >= 7.6 && lt < 8.2);
        g.text(30, yy, b, sel ? "9" : fresh ? "2" : b.startsWith("[") ? "0" : "1");
      }
    });
    if (tab === 2 && lt >= 7.6 && lt < 8.4) g.text(30, 5, "↑ moved", "2");
    // exit dialog
    if (lt >= 10.8) {
      const bx = 18, by = 9, bw = 40, bh = 7;
      g.fill(bx, by, bw, bh, " ");
      g.box(bx, by, bw, bh, "double", "9");
      g.text(bx + 12, by, " Setup Confirmation ", "9");
      g.text(bx + 4, by + 2, "Save configuration changes and", "0");
      g.text(bx + 4, by + 3, "exit now?", "0");
      const yes = lt >= 12.2;
      g.text(bx + 10, by + 5, yes ? "▐[Yes]▌" : " [Yes] ", yes ? "2" : "3");
      g.text(bx + 22, by + 5, yes ? " [No] " : "▐[No]▌", yes ? "3" : "0");
      if (lt >= 12.8) {
        g.fill(bx, by, bw, bh, " ");
        g.box(bx, by, bw, bh, "double", "7");
        g.text(bx + 5, by + 3, "Saving to CMOS" + ".".repeat(1 + Math.floor((lt - 12.8) * 4) % 4), "2");
      }
    }
    // footer keys
    const keys = [["F1", "Help"], ["↑↓", "Select Item"], ["+/-", "Change Values"], ["F9", "Setup Defaults"], ["Esc", "Exit"], ["←→", "Select Menu"], ["Enter", "Select"], ["F10", "Save and Exit"]];
    let fx = 2;
    keys.forEach(([k, d], i) => {
      const y = H - 2 + (i >= 4 ? 1 : 0);
      if (i === 4) fx = 2;
      g.text(fx, y, k, "0"); g.text(fx + k.length + 1, y, d, "a");
      fx += 22;
    });
    return g.frame();
  };
}
