/* twin-pane-commander: a retro two-pane file manager copying a folder across with a progress dialog. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "twin-pane-commander",
  name: "Twin Pane Commander",
  category: "screens",
  note: "A retro two-pane file manager where the cursor picks files, a copy dialog fills its progress bar and the files land in the other pane.",
  tags: ["retro", "dos", "file-manager", "terminal", "files", "nostalgia"],
  cols: 100, rows: 30, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd", "#1f6feb"]),
};

const LEFT = [
  ["..", "UP--DIR", "", true], ["DRIVERS", "SUB-DIR", "03-14-26", true], ["GAMES", "SUB-DIR", "06-02-26", true], ["UTILS", "SUB-DIR", "01-09-26", true],
  ["AUTOEXEC.BAT", "512", "09-30-26"], ["CONFIG.SYS", "389", "09-30-26"], ["EDIT.COM", "69886", "04-09-94"],
  ["MOUSE.COM", "56408", "03-10-93"], ["ZIPPER.EXE", "41245", "02-01-93"], ["README.TXT", "8211", "10-17-26"],
  ["REPORT.DOC", "24576", "10-15-26"], ["SALES.XLS", "31744", "10-16-26"], ["BLOCKS.BAS", "12010", "07-22-95"],
];
const RIGHT0 = [["..", "UP--DIR", "", true], ["ARCHIVE", "SUB-DIR", "08-08-26", true], ["BUDGET.TXT", "2140", "10-01-26"], ["NOTES.TXT", "980", "10-12-26"]];
const PICK = [9, 10, 11];
const PERIOD = 15;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const PW = W / 2;
  // cursor path in left pane
  const curAt = (lt) => {
    if (lt < 1) return 0;
    if (lt < 5.2) return Math.min(11, Math.floor((lt - 1) / 0.35));
    return 11;
  };
  const drawPane = (x0, title, rows, cur, active, marked, fresh) => {
    g.box(x0, 0, PW, H - 3, "double", "3");
    g.text(x0 + Math.floor(PW / 2 - title.length / 2) - 1, 0, " " + title + " ", active ? "9" : "a");
    g.text(x0 + 2, 1, "Name".padEnd(14), "9"); g.set(x0 + 16, 1, "│", "3");
    g.text(x0 + 18, 1, "Size".padStart(8), "9"); g.set(x0 + 27, 1, "│", "3");
    g.text(x0 + 29, 1, "Date", "9");
    for (let y = 1; y < H - 6; y++) { g.set(x0 + 16, y, "│", "3"); g.set(x0 + 27, y, "│", "3"); }
    rows.forEach(([n, s, d, dir], i) => {
      const y = 2 + i;
      if (y >= H - 6) return;
      const sel = active && i === cur;
      const mk = marked.includes(i);
      const c = sel ? "0" : mk ? "9" : fresh.includes(n) ? "2" : dir ? "0" : "a";
      if (sel) { g.set(x0 + 1, y, "▐", "b"); g.set(x0 + PW - 2, y, "▌", "b"); }
      g.text(x0 + 2, y, (dir ? n : n.split(".")[0]).padEnd(9) + (dir ? "" : (n.split(".")[1] || "").padEnd(4)), c);
      g.text(x0 + 18, y, s.padStart(8), c);
      g.text(x0 + 29, y, d, c);
      if (sel) for (let k = x0 + 2; k < x0 + PW - 2; k++) if (g.get(k, y) === " ") g.set(k, y, "░", "b");
    });
    g.hline(x0 + 1, x0 + PW - 2, H - 6, "─", "3");
    g.set(x0, H - 6, "╟", "3"); g.set(x0 + PW - 1, H - 6, "╢", "3");
    const r = rows[active ? cur : 0];
    g.text(x0 + 2, H - 5, r[0], "a");
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const cur = curAt(lt);
    const marked = PICK.filter((i, k) => lt >= 3.9 + k * 0.35 + 0.1 && lt < 10.6);
    const copyP = Math.max(0, Math.min(1, (lt - 6.4) / 3.6));
    const right = RIGHT0.slice();
    const landed = PICK.filter((i, k) => copyP > (k + 1) / PICK.length - 0.01);
    landed.forEach((i) => right.push(LEFT[i]));
    const fresh = lt < 12.5 ? landed.map((i) => LEFT[i][0]) : [];
    const leftActive = lt < 11.5;
    drawPane(0, "C:\\", LEFT, cur, leftActive, marked, []);
    drawPane(PW, "A:\\BACKUP", right, Math.min(right.length - 1, 4 + Math.floor((lt - 11.5) / 0.5)), !leftActive, [], fresh);
    // command line
    g.text(0, H - 3, "C:\\>", "0");
    const cmdKeys = lt >= 5.6 && lt < 6.4 ? "copy" : "";
    g.text(4, H - 3, cmdKeys, "9");
    if (Math.floor(lt * 3) % 2 === 0) g.set(4 + cmdKeys.length, H - 3, "_", "0");
    // dialog
    if (lt >= 5.6 && lt < 10.6) {
      const bx = 24, by = 9, bw = 52, bh = 9;
      g.fill(bx, by, bw, bh, " ");
      g.box(bx, by, bw, bh, "double", "0");
      g.text(bx + 21, by, " Copy ", "9");
      if (lt < 6.4) {
        g.text(bx + 3, by + 2, "Copy 3 files to", "0");
        g.text(bx + 3, by + 3, "A:\\BACKUP\\" + "_".repeat(30), "a");
        g.text(bx + 12, by + 6, "[ Copy ]", "9"); g.text(bx + 30, by + 6, "[ Cancel ]", "1");
      } else {
        const fi = Math.min(PICK.length - 1, Math.floor(copyP * PICK.length));
        const fp = Math.min(1, copyP * PICK.length - fi);
        g.text(bx + 3, by + 2, "Copying the file", "0");
        g.text(bx + 3, by + 3, "C:\\" + LEFT[PICK[fi]][0], "9");
        g.text(bx + 3, by + 4, "to A:\\BACKUP\\" + LEFT[PICK[fi]][0], "9");
        const bw2 = bw - 14;
        const n1 = Math.round(fp * bw2), n2 = Math.round(copyP * bw2);
        g.text(bx + 3, by + 5, "█".repeat(n1), "a"); g.text(bx + 3 + n1, by + 5, "░".repeat(bw2 - n1), "8"); g.text(bx + bw - 9, by + 5, String(Math.round(fp * 100)).padStart(3) + "%", "0");
        g.text(bx + 3, by + 6, "█".repeat(n2), "2"); g.text(bx + 3 + n2, by + 6, "░".repeat(bw2 - n2), "8"); g.text(bx + bw - 9, by + 6, String(Math.round(copyP * 100)).padStart(3) + "%", "0");
        g.text(bx + 3, by + 7, `Total ${Math.round(copyP * 64531)} of 64531 bytes`, "1");
      }
    }
    // function keys
    const F = ["Help", "Menu", "View", "Edit", "Copy", "RenMov", "Mkdir", "Delete", "PullDn", "Quit"];
    let x = 0;
    F.forEach((n, i) => {
      const k = String(i + 1);
      g.text(x, H - 2, k, "0");
      g.text(x + k.length, H - 2, n.padEnd(8), i === 4 && lt >= 5.6 && lt < 6.4 ? "9" : "a");
      x += 10;
    });
    g.text(0, H - 1, `${marked.length ? marked.length + " files selected, 64,531 bytes" : "Bytes free: 1,412,096 on A:"}`, "1");
    return g.frame();
  };
}
