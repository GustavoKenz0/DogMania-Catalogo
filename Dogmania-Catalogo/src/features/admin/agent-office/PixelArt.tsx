import type { Badge, OfficeAgent } from "./model";

const size = 18;
const coats = [
  { f: "#ed9a3b", h: "#ffcb58", s: "#b95c38", w: "#fff2cd" },
  { f: "#8388a3", h: "#adb1c8", s: "#545675", w: "#f4f1f3" },
  { f: "#e87356", h: "#ffab78", s: "#ae453d", w: "#fff4de" },
  { f: "#d2a06e", h: "#f3c88d", s: "#9e653e", w: "#fff1d0" },
  { f: "#706077", h: "#a88b91", s: "#493951", w: "#f2d9bd" },
  { f: "#bca38e", h: "#efd0a1", s: "#826e83", w: "#fff6dc" },
] as const;

const badgeColors: Record<Badge, string> = {
  star: "#ffe170",
  gear: "#f0b877",
  brush: "#f6d8ff",
  code: "#c9faff",
  stack: "#d2ffb2",
  check: "#d3f296",
  page: "#fff8e5",
  shield: "#d9e2ff",
};

type Row = string | readonly [x: number, pixels: string];

// Each character is a whole pixel. Short rows are centered unless they provide an x offset.
function pixelFrame(rows: Row[], top = 0) {
  const paths = new Map<string, string>();
  rows.forEach((row, y) => {
    const [x, pixels] = typeof row === "string" ? [Math.floor((size - row.length) / 2), row] : row;
    for (const match of pixels.matchAll(/([^.])\1*/g)) {
      const length = match[0].length;
      const color = match[1];
      const run = "M" + (x + match.index) + " " + (y + top) + "h" + length + "v1h-" + length + "z";
      paths.set(color, (paths.get(color) ?? "") + run);
    }
  });
  return [...paths];
}

const dogFront = pixelFrame([
  "",
  "######",
  "##hhhhhh##",
  "#shhhffhhhs#",
  "##shhffffhhs##",
  "#spf#ffff#fps#",
  "#sfffwwwwfffs#",
  "#ssfw##wfwfss#",
  "##fwwwtwwf##",
  "##rrrbrr##",
  "#fwwwwf#",
  [2, "##.##fwwf##"],
  [2, "#s##ffwwff##"],
  [3, "#ssfwwwwff#"],
  "#ffwwff#",
  "#fww#wwf#",
  "##########",
]);

const dogSide = pixelFrame([
  "",
  [8, "###...##"],
  [7, "#pp##.#p#"],
  [7, "#pfff#fp#"],
  [7, "#phhfff##"],
  [7, "##hh#fff##"],
  [8, "#ffwwwww#"],
  [8, "#ffwwww##"],
  [8, "#rrrb###"],
  [5, "####srrrw#"],
  [1, "##.##ssffwww#"],
  [1, "#s##sffffwwww#"],
  [2, "#ssshhffffwww#"],
  [3, "#sfhhfwwwwww#"],
  [4, "#ffw####ww#"],
]);

const catFront = pixelFrame([
  "",
  [4, "##......##"],
  [4, "#p#....#p#"],
  [4, "#ps####sp#"],
  "##sfshhfsfs##",
  "#shhshhshhs#",
  "#f#fwfwf#f#",
  "#sffw#wffs#",
  "#fwfffffwf#",
  "##fwttwf##",
  "#rrbrr#",
  [2, "##..#fwwf#"],
  [1, "#s#.#ffwwff#"],
  [2, "#s##sffwwfs#"],
  [3, "#sf#fwwwwf#"],
  [4, "##sfw#wwf#"],
  [5, "#########"],
]);

const catSide = pixelFrame([
  "",
  [9, "###..###"],
  [8, "#pff##ffp#"],
  [8, "#pfffhhfp#"],
  [8, "#fhfffhh##"],
  [8, "##wwff#f#"],
  [8, "#wwwwff##"],
  [9, "#wwww#ww#"],
  [1, "##......#wwwwtww#"],
  [1, "#w#....##rwrww##"],
  [1, "#lw#.###wwrrb##"],
  [2, "#w###wwlwwwww#"],
  [3, "#fwwllwwwwww#"],
  [4, "#wllwwwwwww#"],
  [4, "#lw######lw#"],
]);

const farPaw = pixelFrame(["###", "#l#", "#l#", "###"], 13);
const nearPaw = pixelFrame(["####", "#lw#", "#ww#", "####"], 13);
// Diagonal pairs move together. Draw the far paws behind the near paws and the coat.
const profilePaws = [
  { x: -1, pixels: farPaw, alternate: true },
  { x: 6, pixels: farPaw, alternate: false },
  { x: -3, pixels: nearPaw, alternate: false },
  { x: 4, pixels: nearPaw, alternate: true },
];

export function Sprite({ agent }: { agent: OfficeAgent }) {
  const index = [...agent.slot].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  const colors: Record<string, string> = {
    ...coats[index % coats.length],
    "#": "#171521",
    p: "#f3928d",
    t: "#ff9a92",
    l: "#c1b3cf",
    r: agent.color,
    b: badgeColors[agent.badge],
  };
  const cat = agent.shape === "cat";
  return (
    <svg viewBox={"0 0 " + size + " " + size} shapeRendering="crispEdges" aria-hidden="true">
      <g className="office-pet-front">
        {(cat ? catFront : dogFront).map(([color, d]) => (
          <path key={color} fill={colors[color]} d={d} />
        ))}
      </g>
      <g className="office-pet-side">
        {profilePaws.map(({ x, pixels, alternate }) => (
          <g
            key={x}
            className={alternate ? "office-pet-paw office-pet-paw--alternate" : "office-pet-paw"}
            transform={"translate(" + x + " 0)"}
          >
            {pixels.map(([color, d]) => (
              <path key={color} fill={colors[color]} d={d} />
            ))}
          </g>
        ))}
        {(cat ? catSide : dogSide).map(([color, d]) => (
          <path key={color} fill={colors[color]} d={d} />
        ))}
      </g>
    </svg>
  );
}
