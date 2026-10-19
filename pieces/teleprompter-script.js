/* teleprompter-script: a speech script scrolling up a prompter screen past a marked reading line, with cues and a running timer. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "teleprompter-script",
  name: "Teleprompter Script",
  category: "lettering",
  note: "A speech script scrolls up a prompter screen past a marked reading line, with stage cues, a recording light and a running timer.",
  tags: ["teleprompter", "speech", "scroll", "reading", "video", "text"],
  cols: 70, rows: 24, fps: 20,
  // 0 reading line, 1 upcoming, 2 already read, 3 frame, 4 cue orange, 5 red rec, 6 muted, 7 marker, 8 next line
  palette: palette(["#ffffff", "#b8c2cc", "#3f4650", "#30363d", "#ffa657", "#ff5f56", "#8b949e", "#7ee787", "#dfe6ec"]),
};

const SCRIPT = `Good evening, and thank you all for coming out on a rainy Thursday. [PAUSE] Two years ago this lot was a fence, a puddle and one very stubborn shopping trolley. Tonight it is forty raised beds, a tool shed and a pumpkin that may need its own postcode. [SMILE] None of it happened because of one person. It happened because Mrs. Adeyemi brought soup to the first meeting, because the Patel twins built the compost bins in a weekend, and because forty strangers kept showing up with gloves. // [LOOK LEFT] So before the speeches get long, I want to say a simple thing. Thank you. [PAUSE] The gate is open every morning at seven. Take a tomato, leave a tomato, and please, nobody tell the pumpkin how big it is. [BEAT] Now, the ribbon. // --- END OF SCRIPT ---`;

function wrap(text, w) {
  const out = [];
  for (const para of text.split(" // ")) {
    let line = "";
    for (const word of para.split(" ")) {
      if (line && (line + " " + word).length > w) { out.push(line); line = word; }
      else line = line ? line + " " + word : word;
    }
    if (line) out.push(line);
    out.push("");
  }
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = 31;
  const lines = wrap(SCRIPT, W);
  const X0 = Math.floor((cols - W * 2) / 2) + 1;
  const TOP = 3, BOT = rows - 4, READ = 11; // rows; each script line takes 2 rows
  const PER = 1.05;                       // seconds per line
  const total = lines.length + 4;
  const writeLine = (y, s, base) => {
    // cues in brackets get the cue colour
    let i = 0, inCue = false;
    for (const ch of s) {
      if (ch === "[") inCue = true;
      g.set(X0 + i * 2, y, ch, inCue ? (base === "2" ? "2" : "4") : base);
      if (ch === "]") inCue = false;
      i++;
    }
  };
  return (t) => {
    g.clear();
    const cyc = total * PER;
    const lt = ((t % cyc) + cyc) % cyc;
    const pos = Math.floor(lt / PER) - 1; // script line on the reading row
    // frame
    g.box(0, 0, cols, rows, "heavy", "3");
    g.hline(1, cols - 2, 2, "─", "3");
    g.hline(1, cols - 2, rows - 3, "─", "3");
    const sec = Math.floor(lt), cs = Math.floor((lt % 1) * 10);
    const time = `00:${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}.${cs}`;
    const recOn = (lt % 1.2) < 0.75;
    g.text(3, 1, recOn ? "●" : "○", "5");
    g.text(5, 1, "REC", "5");
    g.text(10, 1, time, "6");
    const speed = "SPEED 1.0x   FONT 48   MIRROR OFF";
    g.text(cols - 3 - speed.length, 1, speed, "6");
    // script lines
    for (let y = TOP; y <= BOT; y++) {
      if ((y - READ) % 2) continue;
      const d = (y - READ) / 2;
      const li = pos + d;
      if (li < 0 || li >= lines.length) continue;
      const s = lines[li];
      if (!s) continue;
      const col = d === 0 ? "0" : d < 0 ? "2" : d === 1 ? "8" : "1";
      writeLine(y, s, col);
    }
    // reading line markers
    g.text(X0 - 5, READ, "──►", "7");
    g.text(X0 + W * 2 + 1, READ, "◄──", "7");
    // footer: progress through the script
    const done = Math.max(0, Math.min(1, (pos + 1) / lines.length));
    const bw = 30, k = Math.round(done * bw);
    g.text(3, rows - 2, "SCRIPT", "6");
    g.text(10, rows - 2, "━".repeat(k), "7");
    g.text(10 + k, rows - 2, "─".repeat(bw - k), "3");
    const ln = `line ${Math.max(1, Math.min(lines.length, pos + 1))}/${lines.length}`;
    g.text(cols - 3 - ln.length, rows - 2, ln, "6");
    return g.frame();
  };
}
