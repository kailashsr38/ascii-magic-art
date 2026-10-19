/* modal-dialog: a confirm dialog pops over a dimmed settings page, focus moves, then it closes. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "modal-dialog",
  name: "Modal Dialog",
  category: "screens",
  note: "A delete confirmation dialog pops up over a dimmed settings page, takes a typed name and closes.",
  tags: ["modal", "dialog", "app", "confirm", "dashboard"],
  cols: 76, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#21262d", "#6e7681"]),
};

const PERIOD = 10;
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
const SPIN = "┤┘┴└├┌┬┐";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const page = (dim, pressed, deleted) => {
    const T = dim ? "8" : "0", M = dim ? "9" : "1", B = dim ? "9" : "7";
    g.box(0, 0, W, H, "round", B);
    g.text(2, 1, "acme / api-gateway", T); g.text(W - 18, 1, "■ Settings", M);
    g.hline(1, W - 2, 2, "─", B);
    ["General", "Access", "Branches", "Webhooks", "Secrets"].forEach((s, i) => g.text(3, 4 + i * 2, (i === 0 ? "▌ " : "  ") + s, i === 0 ? T : M));
    g.vline(16, 3, H - 2, "│", B);
    g.text(19, 4, "General", T);
    g.text(19, 6, "Repository name", M); if (!dim) g.box(19, 7, 30, 3, "light", B); g.text(21, 8, deleted ? "" : "api-gateway", T);
    g.text(19, 11, "Default branch", M); g.text(36, 11, "main", dim ? "8" : "3");
    g.text(19, 12, "Visibility", M); g.text(36, 12, "Private", T);
    // under the scrim only the text of the page shows; boxes would be cut by the modal
    if (!dim) g.box(19, 15, W - 22, 7, "light", "5");
    g.text(21, 15, " Danger zone ", dim ? "8" : "5");
    g.text(21, 17, "Delete this repository", T);
    g.text(21, 18, "Once deleted, it is gone.", M);
    if (!dim) g.box(W - 26, 16, 21, 3, pressed ? "heavy" : "light", "5");
    if (!dim) g.text(W - 24, 17, "Delete repository", "5");
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const open = ease((lt - 1.3) / 0.35) * (1 - ease((lt - 8.0) / 0.3));
    const deleted = lt > 8.35;
    page(open > 0.05, lt > 0.9 && lt < 1.3, deleted);
    if (lt < 1.3) {
      const cx = Math.round(30 + (W - 16 - 30) * ease(lt / 0.9)), cy = Math.round(9 + 8 * ease(lt / 0.9));
      if (!"─│┌┐└┘┏┓┗┛━┃".includes(g.get(cx, cy))) g.set(cx, cy, "↖", "0"); // pointer passes under borders
    }
    if (deleted) {
      g.box(19, 3, 40, 3, "round", "2");
      g.text(21, 4, "✓ Repository api-gateway deleted", "2");
    }
    if (open > 0.02) {
      const mw = Math.round(14 + 40 * open), mh = Math.max(3, Math.round(15 * open));
      const x = Math.round((W - mw) / 2), y = Math.round((H - mh) / 2);
      g.fill(x, y, mw, mh, " ");
      g.box(x, y, mw, mh, "round", "a");
      if (open > 0.95) {
        g.text(x + 3, y + 1, "Delete repository?", "0"); g.text(x + mw - 4, y + 1, "×", "1");
        g.hline(x + 1, x + mw - 2, y + 2, "─", "8");
        g.text(x + 3, y + 3, "This permanently deletes ", "1"); g.text(x + 28, y + 3, "api-gateway", "0");
        g.text(x + 3, y + 4, "with its 128 deployments and 14 secrets.", "1");
        g.text(x + 3, y + 5, "This cannot be undone.", "5");
        g.text(x + 3, y + 7, "Type ", "1"); g.text(x + 8, y + 7, "api-gateway", "4"); g.text(x + 19, y + 7, " to confirm", "1");
        const typed = "api-gateway".slice(0, Math.max(0, Math.floor((lt - 3.2) / 0.11)));
        const fIn = lt > 3.0 && lt < 4.7;
        g.box(x + 3, y + 8, mw - 6, 3, fIn ? "heavy" : "light", fIn ? "3" : "8");
        g.text(x + 5, y + 9, typed, "0");
        if (fIn && Math.floor(lt * 3) % 2 === 0) g.set(x + 5 + typed.length, y + 9, "█", "3");
        // buttons: focus Cancel (1.8..3.0), input (3.0..4.7), Delete (4.7..)
        const fCancel = lt > 1.8 && lt < 3.0, fDel = lt >= 4.7;
        const ready = typed.length === 11;
        const press = lt > 6.2 && lt < 6.45;
        const by = y + mh - 4;
        g.box(x + mw - 33, by, 12, 3, fCancel ? "heavy" : "light", fCancel ? "3" : "a");
        g.text(x + mw - 30, by + 1, "Cancel", fCancel ? "0" : "1");
        g.box(x + mw - 19, by, 16, 3, fDel ? (press ? "double" : "heavy") : "light", ready ? "5" : "8");
        if (lt > 6.4) g.text(x + mw - 17, by + 1, SPIN[Math.floor(lt * 12) % 8] + " Deleting", "5");
        else g.text(x + mw - 16, by + 1, "Delete repo", ready ? "5" : "a");
        g.text(x + 3, by + 1, fCancel ? "esc to close" : fDel ? "enter to confirm" : "tab to move", "a");
      }
    }
    return g.frame();
  };
}
