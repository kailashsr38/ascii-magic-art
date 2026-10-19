/* text-adventure-parser: an interactive fiction session where commands are typed at the prompt and the parser answers. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "text-adventure-parser",
  name: "Lighthouse Text Adventure",
  category: "retro",
  note: "A text adventure in an old lighthouse where the player types commands at the prompt, the parser answers, the score and move counter tick up and the light is lit at last.",
  tags: ["retro", "text adventure", "game", "interactive fiction", "terminal", "readme"],
  cols: 80, rows: 26, fps: 20,
  palette: palette(["#e8e2d0", "#a8a290", "#5c584c", "#ffcf6a", "#7ee787", "#79c0ff", "#2a2820", "#ffffff"]),
};

const STORY = [
  ["r", "LIGHTHOUSE STAIRS", "You stand at the foot of a spiral staircase. Salt wind whistles through a broken window above. A brass lamp lies on the bottom step."],
  ["c", "take lamp", "Taken.", 0],
  ["c", "light lamp", "The wick catches. The lamp flickers, then settles into a steady yellow glow.", 5],
  ["c", "go up", null, 0],
  ["r", "LAMP ROOM", "The great lens fills the room, dusty and dark. A logbook rests on a desk by the wall. Stairs lead down."],
  ["c", "read logbook", "The last entry reads: \"Storm coming. Keep the light burning.\"", 0],
  ["c", "examine lens", "Cracked, but whole. A socket at its base looks just the size of your lamp.", 0],
  ["c", "put lamp in socket", "The lens catches the flame and throws a long beam far out across the sea. Somewhere below, a ship's horn answers.", 10],
  ["c", "score", "You have scored 15 out of a possible 15, in 7 moves.", 0],
];
const WRAP = 74;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const wrap = (s) => {
    const out = []; let line = "";
    for (const w of s.split(" ")) { if (line && line.length + 1 + w.length > WRAP) { out.push(line); line = w; } else line = line ? line + " " + w : w; }
    out.push(line); return out;
  };
  // timeline: each item becomes timed lines
  const items = [];
  let tt = 0.2, score = 0, moves = 0, room = "Lighthouse Stairs";
  for (const s of STORY) {
    if (s[0] === "r") {
      items.push({ t: tt, text: s[1], co: "3", room: s[1] });
      tt += 0.2;
      for (const l of wrap(s[2])) { items.push({ t: tt, text: l, co: "0" }); tt += 0.08; }
      items.push({ t: tt, text: "", co: "0" }); tt += 0.6;
    } else {
      const cmd = s[1];
      items.push({ t: tt, text: ">", co: "4", cmd, typeT: tt + 0.5 });
      tt += 0.5 + cmd.length * 0.11 + 0.45;
      moves++;
      score += s[3];
      if (s[2]) { for (const l of wrap(s[2])) items.push({ t: tt, text: l, co: "1", score, moves }); tt += 0.12; items.push({ t: tt, text: "", co: "0", score, moves }); tt += 1.1; }
      else { items.push({ t: tt, text: "", co: "0", score, moves }); tt += 0.2; }
    }
  }
  const PERIOD = tt + 3;
  void room;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const shown = items.filter((it) => it.t <= lt);
    let sc = 0, mv = 0, rm = "Lighthouse Stairs";
    const lines = [];
    let cursor = null;
    for (const it of shown) {
      if (it.room) rm = it.room.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      if (it.score !== undefined) { sc = it.score; mv = it.moves; }
      if (it.cmd !== undefined) {
        const n = Math.max(0, Math.min(it.cmd.length, Math.floor((lt - it.typeT) / 0.11) + 1));
        const typed = lt < it.typeT ? "" : it.cmd.slice(0, n);
        lines.push([">" + typed, "4", true]);
      } else lines.push([it.text, it.co, false]);
    }
    const last = lines[lines.length - 1];
    if (last && last[2]) cursor = lines.length - 1;
    if (lt > items[items.length - 1].t + 0.3) { lines.push([">", "4", true]); cursor = lines.length - 1; }
    // status bar
    g.fill(0, 0, W, 1, "█", "6");
    const right = "Score: " + String(sc).padStart(2) + "   Moves: " + String(mv).padStart(2);
    g.text(1, 0, " " + rm + " ", "7");
    g.text(W - right.length - 2, 0, " " + right + " ", "7");
    g.fill(0, 1, W, 1, "▀", "6");
    const VIEW = H - 3;
    const top = Math.max(0, lines.length - VIEW);
    for (let i = top; i < lines.length; i++) {
      const [s, co, isCmd] = lines[i];
      const y = 2 + i - top;
      if (isCmd) { g.text(2, y, ">", "4"); g.text(3, y, s.slice(1), "7"); }
      else g.text(2, y, s, co);
    }
    if (cursor !== null && cursor >= top && Math.floor(lt * 3) % 2 === 0) g.set(3 + lines[cursor][0].length - 1, 2 + cursor - top, "█", "4");
    return g.frame();
  };
}
