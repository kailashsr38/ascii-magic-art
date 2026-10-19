/* end-credits-roll: film end credits rolling up a letterboxed screen, roles against a centre gutter, names beside them. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "end-credits-roll",
  name: "End Credits Roll",
  category: "lettering",
  note: "Film end credits roll up a letterboxed screen, roles right-aligned against a centre gutter, names beside them and section headings in between.",
  tags: ["credits", "film", "scroll", "outro", "hero", "text"],
  cols: 72, rows: 30, fps: 24,
  // 0 name, 1 role, 2 heading, 3 faded edge, 4 bar, 5 half faded, 6 title
  palette: palette(["#f2ead8", "#a39a86", "#e3b341", "#3d382f", "#17150f", "#6f675a", "#ffd56b"]),
};

const C = [
  ["t", "THE LONG WAY HOME"],
  ["g"], ["g"],
  ["h", "CAST"], ["g"],
  ["p", "Ines Marlowe", "Wren Adebayo"],
  ["p", "Captain Oduya", "Tomas Hale"],
  ["p", "The Lighthouse Keeper", "Priya Castell"],
  ["p", "Young Ines", "Mila Okonkwo"],
  ["p", "Ferry Pilot", "Arno Vestergaard"],
  ["p", "Woman With Umbrella", "Saoirse Lund"],
  ["p", "Night Clerk", "Dev Ramaswamy"],
  ["g"], ["g"],
  ["h", "CREW"], ["g"],
  ["p", "Directed by", "Hana Iversen"],
  ["p", "Written by", "Hana Iversen"],
  ["p", "", "Joel Brightwater"],
  ["p", "Produced by", "Lucia Ferrand"],
  ["p", "Director of Photography", "Kofi Mensah-Ward"],
  ["p", "Editor", "Ruth Calloway"],
  ["p", "Production Designer", "Emil Sandqvist"],
  ["p", "Original Music", "Noor Haddad"],
  ["p", "Sound Mixer", "Bram Okafor"],
  ["p", "Costume Designer", "Ada Penhaligon"],
  ["g"], ["g"],
  ["h", "SECOND UNIT"], ["g"],
  ["p", "Gaffer", "Luis Arroyo"],
  ["p", "Best Boy Electric", "Kit Tamura"],
  ["p", "Key Grip", "Olu Bankole"],
  ["p", "Boom Operator", "Fern Whitlock"],
  ["p", "Script Supervisor", "Mae Lindqvist"],
  ["p", "Catering", "The Harbour Kitchen"],
  ["p", "Ship's Cat", "Biscuit"],
  ["g"], ["g"],
  ["c", "Filmed on location along the north coast"],
  ["c", "No lighthouses were harmed in the making of this film"],
  ["g"], ["g"],
  ["t", "THANK YOU FOR WATCHING"],
  ["g"], ["g"], ["g"], ["g"], ["g"], ["g"],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const MID = 36, TOP = 2, BOT = rows - 3; // visible text rows TOP..BOT
  const H = C.length;
  const view = BOT - TOP + 1;
  const SPEED = 2.4;
  // spaced capitals for titles
  const spaced = (s) => s.split("").join(" ");
  return (t) => {
    g.clear();
    // letterbox bars
    for (let x = 0; x < cols; x++) {
      g.set(x, 0, "█", "4"); g.set(x, 1, "▀", "4");
      g.set(x, rows - 1, "█", "4"); g.set(x, rows - 2, "▄", "4");
    }
    const total = H + view;
    const off = ((t * SPEED + view - 3) % total + total) % total; // rows scrolled
    const base = Math.floor(off);
    for (let y = TOP; y <= BOT; y++) {
      const i = y - BOT + base; // content index shown on this row
      if (i < 0 || i >= H) continue;
      const e = C[i];
      const dEdge = Math.min(y - TOP, BOT - y);
      const fade = dEdge === 0 ? "3" : dEdge === 1 ? "5" : null;
      if (e[0] === "t") {
        const s = spaced(e[1]);
        g.text(Math.floor((cols - s.length) / 2), y, s, fade || "6");
      } else if (e[0] === "h") {
        const s = spaced(e[1]);
        const x0 = Math.floor((cols - s.length) / 2);
        g.text(x0, y, s, fade || "2");
        g.hline(x0 - 8, x0 - 3, y, "─", fade || "3"); g.hline(x0 + s.length + 2, x0 + s.length + 7, y, "─", fade || "3");
      } else if (e[0] === "p") {
        g.text(MID - 2 - e[1].length, y, e[1], fade || "1");
        g.text(MID + 2, y, e[2], fade || "0");
      } else if (e[0] === "c") {
        g.text(Math.floor((cols - e[1].length) / 2), y, e[1], fade || "1");
      }
    }
    return g.frame();
  };
}
