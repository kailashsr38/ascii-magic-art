/* install-log: a package manager resolving, fetching and linking packages, then a summary. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "install-log",
  name: "Install Log",
  category: "screens",
  note: "A package manager install log resolving, fetching and linking packages, ending in a green summary.",
  tags: ["terminal", "install", "cli", "npm", "loader", "developer"],
  cols: 80, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const PKGS = [
  ["picocolors", "1.1.1"], ["semver", "7.6.3"], ["zod", "3.23.8"], ["fast-glob", "3.3.2"], ["undici", "6.19.8"],
  ["esbuild", "0.24.0"], ["vitest", "2.1.3"], ["typescript", "5.6.3"], ["dotenv", "16.4.5"], ["pino", "9.4.0"],
  ["ws", "8.18.0"], ["yaml", "2.6.0"], ["nanoid", "5.0.7"], ["date-fns", "4.1.0"], ["commander", "12.1.0"],
];
const PERIOD = 13;
const SPIN = "┤┘┴└├┌┬┐";
const ease = (v) => Math.max(0, Math.min(1, v));

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const r = rng(77);
  const pk = PKGS.map(([n, v], i) => [n, v, 1.6 + i * 0.28 + r() * 0.15, r() < 0.3]);
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " ~/projects/api-gateway ", "1");
    const cmd = "pkg install";
    const nt = Math.max(0, Math.min(cmd.length, Math.floor((lt - 0.2) / 0.06)));
    g.text(2, 1, "$ ", "2"); g.text(4, 1, cmd.slice(0, nt), "0");
    if (lt < 1.0) { if (Math.floor(lt * 3) % 2 === 0) g.set(4 + nt, 1, "█", "0"); return g.frame(); }
    const p1 = ease((lt - 1.0) / 1.6), p2 = ease((lt - 1.8) / 4.2), p3 = ease((lt - 5.2) / 1.6);
    const sp = SPIN[Math.floor(lt * 12) % 8];
    const total = 412;
    const resolved = Math.round(p1 * total), down = Math.round(p2 * 23), added = Math.round(p3 * total);
    g.text(2, 2, "Lockfile is up to date, resolution step is skipped", "1");
    g.text(2, 3, "Progress: resolved ", "1");
    let x = 21;
    const put = (s, c) => { g.text(x, 3, s, c); x += s.length; };
    put(String(resolved), "0"); put(", reused ", "1"); put(String(Math.round(p1 * 389)), "0"); put(", downloaded ", "1");
    put(String(down), "0"); put(", added ", "1"); put(String(added), "0");
    if (p3 >= 1) put(", done", "2");
    // package lines stream in
    let y = 5;
    g.text(2, y++, "Packages: ", "0"); g.text(12, y - 1, "+" + Math.round(Math.max(p1 * 0.4, p3) * total), "2");
    const n = Math.max(0, Math.min(total, Math.round(p3 * 60)));
    let bar = "";
    for (let i = 0; i < 60; i++) bar += i < n ? "+" : " ";
    g.text(2, y++, bar, "2");
    y++;
    const shown = pk.filter((p) => p[2] <= lt);
    shown.slice(-9).forEach(([name, v, at, fetched]) => {
      const fin = lt - at > 0.9 || p3 > 0;
      g.text(2, y, fin ? "✓" : sp, fin ? "2" : "3");
      g.text(4, y, name, "0"); g.text(17, y, v, "1");
      g.text(26, y, fin ? (fetched ? "downloaded" : "reused from store") : "fetching", fin ? (fetched ? "3" : "7") : "4");
      const kb = Math.round(40 + ((name.length * 977) % 900));
      g.text(46, y, (kb + " kB").padStart(7), "1");
      y++;
    });
    // live bar
    const bw = 40, tot = p1 * 0.25 + p2 * 0.45 + p3 * 0.3, nb = Math.round(tot * bw);
    const by = H - 6;
    if (tot < 1) {
      g.text(2, by, sp, "3");
      g.text(4, by, ["resolving", "fetching", "linking"][p1 < 1 ? 0 : p2 < 1 ? 1 : 2], "0");
      g.text(15, by, "█".repeat(nb), "3"); g.text(15 + nb, by, "░".repeat(bw - nb), "8");
      g.text(57, by, String(Math.round(tot * 100)).padStart(3) + "%", "0");
    } else {
      g.text(2, by - 1, "dependencies:", "0");
      g.text(2, by, "+ picocolors 1.1.1   + zod 3.23.8   + pino 9.4.0   + undici 6.19.8", "2");
      g.text(2, by + 2, "Done in 6.4s", "2");
      const sum = `· added ${total} packages · audited 413 · `;
      g.text(15, by + 2, sum, "1");
      g.text(15 + sum.length, by + 2, "0 vulnerabilities", "2");
      g.text(2, by + 3, "$ ", "2");
      if (Math.floor(lt * 3) % 2 === 0) g.set(4, by + 3, "█", "0");
    }
    return g.frame();
  };
}
