import {
  cornerPlants,
  interiorWindows,
  officeDoors,
  officePartitions,
  officeSize,
} from "./officeLayout";

const ink = "#162639";
const wall = "#24405b";
const blue = "#326584";
const oak = "#bd854e";
const cream = "#e5d9bc";

function WindowPanel({
  x,
  y,
  length,
  vertical = false,
}: {
  x: number;
  y: number;
  length: number;
  vertical?: boolean;
}) {
  return (
    <g transform={"translate(" + x + " " + y + ")" + (vertical ? " rotate(90)" : "")}>
      <rect width={length} height="7" fill={ink} />
      <rect x="1" y="1" width={length - 2} height="5" fill="#4faabf" />
      <rect x="1" y="1" width={length - 2} height="2" fill="#b3f1ed" />
      <rect x="1" y="5" width={length - 2} height="1" fill="#27758e" />
      {[12, 25, 38, 51, 64]
        .filter((offset) => offset < length - 3)
        .map((offset) => (
          <path key={offset} fill={wall} d={"M" + offset + " 0h1v7h-1z"} />
        ))}
    </g>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g data-corner-plant="" transform={"translate(" + x + " " + y + ") scale(.72)"}>
      <path fill="#263345" d="M-5 2H6v2H5v5H3v2h-6V9h-2z" />
      <path fill="#8f9b98" d="M-4 3h8v5H2v2h-4V8h-2z" />
      <path fill="#214c44" d="M-1-9h3v3h2v-3h4v4H6v3h2v3H4v3h-8V1h-3v-4h3v-2h-2v-3h4v3h1z" />
      <path fill="#61995c" d="M0-7h1v4h2v-2h3v2H4v3h2v1H3v2h-5V0h-3v-2h3v1h2z" />
      <path fill="#9bb96a" d="M0-6h1v3H0zm-4 4h2v1h-2zm7-2h2v1H3z" />
    </g>
  );
}

function Chair({
  x,
  y,
  angle = 0,
  red = false,
}: {
  x: number;
  y: number;
  angle?: number;
  red?: boolean;
}) {
  return (
    <g transform={"translate(" + x + " " + y + ") rotate(" + angle + ")"}>
      <path fill={ink} d="M-5-5h10v2h2v8H5v2H1v2H4v2h-8V9h3V7h-4V5h-2v-8h2z" />
      <path fill={red ? "#834747" : blue} d="M-5-3h10v7H4v2h-8V4h-1z" />
      <path fill={red ? "#b36553" : "#548aa4"} d="M-4-4h8v2h-8zM-4 2h8v1h-8z" />
      <path fill="#172c41" d="M-7 0h2v4h-2zm12 0h2v4H5z" />
    </g>
  );
}

function Sofa({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={"translate(" + x + " " + y + ")" + (flip ? " rotate(180 23 8)" : "")}>
      <path fill="#233244" opacity=".42" d="M0 12h47v8H0z" />
      <path fill={ink} d="M2 0h42v2h2v14h-3v3H3v-3H0V2h2z" />
      <path fill={blue} d="M4 2h38v4h2v8h-4v3H6v-3H2V6h2z" />
      <path fill="#4b82a0" d="M4 2h18v5H4zm20 0h18v5H24zM6 9h16v5H6zm18 0h16v5H24z" />
      <path fill="#27526d" d="M6 14h34v2H6z" />
    </g>
  );
}

function Frame({ x, y, width = 22 }: { x: number; y: number; width?: number }) {
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      <rect width={width} height="9" fill={ink} />
      <rect x="1" y="1" width={width - 2} height="7" fill={cream} />
      <rect x="3" y="2" width={width - 6} height="5" fill="#4c9bb5" />
      <path fill="#d8b677" d="M4 5h4V4h5v1h3v1h-2v1H6V6H4z" />
    </g>
  );
}

function Monitor({ x, y }: { x: number; y: number }) {
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      <path fill={ink} d="M0 0h22v11h-8v2h3v1H5v-1h3v-2H0z" />
      <path fill="#377ca4" d="M1 1h20v9H1z" />
      <path fill="#8adce5" d="M2 2h18v2H2zm0 3h8v4H2zm10 0h8v1h-8zm0 2h7v1h-7z" />
      <path fill="#f6e9ca" d="M3 6h5v1H3zm1 2h5v1H4z" />
    </g>
  );
}

function WorkDesk({ x, y, variant }: { x: number; y: number; variant: number }) {
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      <path fill="#263143" opacity=".4" d="M0 14h46v12H0z" />
      <path fill={ink} d="M0 3h45v19h-9v-5H9v5H0z" />
      <path fill={oak} d="M1 3h43v14H1z" />
      <path fill="#e0aa6e" d="M1 3h43v2H1zM3 8h12v1H3zm25 5h12v1H28z" />
      <path fill="#654933" d="M1 16h43v2H1z" />
      <path fill="#657681" d="M1 18h7v3H1zm36 0h7v3h-7z" />
      <Monitor x={11} y={0} />
      <path fill={ink} d="M13 13h17v3H13zM33 13h2v2h-2z" />
      <path fill="#8499a4" d="M14 14h15v1H14z" />
      {variant % 2 === 0 ? (
        <>
          <path fill="#f5e5bc" d="M37 8h5v6h-5z" />
          <path fill="#bfa284" d="M38 9h3v1h-3zm0 2h3v1h-3z" />
        </>
      ) : (
        <>
          <path fill="#29475a" d="M36 7h5v6h-5z" />
          <path fill="#65a7b4" d="M37 8h3v1h-3z" />
        </>
      )}
      <path fill={variant % 3 === 0 ? "#ab5651" : "#456c83"} d="M4 8h4v6H4z" />
    </g>
  );
}

function Wall({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={ink} />
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={wall} />
      <rect x={x + 1} y={y + 1} width={width - 2} height="1" fill="#476682" />
    </g>
  );
}

function Door({
  x,
  y,
  length,
  vertical,
}: {
  x: number;
  y: number;
  length: number;
  vertical: boolean;
}) {
  return (
    <g transform={"translate(" + x + " " + y + ")" + (vertical ? " rotate(90)" : "")}>
      <rect y="-3" width={length} height="6" fill="#b8a683" />
      <rect y="2" width={length} height="1" fill="#d6c39a" />
      <path fill="#654731" d={"M0-3h2v6H0zm" + (length - 2) + " 0h2v6h-2z"} />
      <path fill="#b38150" d="M1-3h2v-5h-2z" />
      <path fill="#e4bc77" d="M1-8h1v2H1z" />
    </g>
  );
}

export function OfficeMap() {
  return (
    <svg
      className="office-backdrop"
      viewBox={"0 0 " + officeSize + " " + officeSize}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        <pattern id="dogmania-floor-tile" width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#d9d1bc" />
          <path fill="#b8ae9a" d="M0 0h7v1H1v6H0z" />
          <path fill="#ebe0ca" d="M1 1h5v1H1z" />
        </pattern>
        <pattern id="dogmania-floor-wood" width="23" height="8" patternUnits="userSpaceOnUse">
          <rect width="23" height="8" fill="#aa764e" />
          <path fill="#875737" d="M0 0h23v1H0zm0 4h23v1H0zm12-3h1v3h-1zM5 5h1v3H5z" />
          <path fill="#be895d" d="M1 2h7v1H1zm14 4h5v1h-5z" />
        </pattern>
        <pattern id="dogmania-floor-carpet" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#748591" />
          <path fill="#637581" d="M0 0h1v1H0zm3 3h1v1H3z" />
          <path fill="#84959e" d="M2 1h1v1H2z" />
        </pattern>
        <pattern id="dogmania-floor-rug" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#8e8171" />
          <path fill="#a99b83" d="M0 0h2v1H0zm3 2h2v1H3zm-1 2h1v1H2z" />
        </pattern>
      </defs>

      <rect width="312" height="312" fill="#ddd7c8" />
      <path fill="#aaa89e" d="M10 9h296v296H10z" />
      <rect x="8" y="8" width="296" height="292" fill="url(#dogmania-floor-tile)" />
      <path fill="url(#dogmania-floor-carpet)" d="M15 104h206v116H15zM102 15h118v82H102z" />
      <path fill="url(#dogmania-floor-wood)" d="M15 15h81v104H15z" />
      <path fill="#c0af96" d="M15 15h81v32H15z" />
      <path fill="#9caaa8" d="M102 15h118v19H102z" />
      <path fill="#a9b6b4" d="M226 102h72v14h-72z" />
      <path fill="#a77b54" d="M15 225h74v25H15z" />
      <path
        stroke="#785339"
        strokeWidth="1"
        d="M18 225v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25m4-25v25"
      />

      <Frame x={49} y={21} width={26} />
      <path fill={ink} d="M46 36h34v14H46z" />
      <path fill="#426378" d="M47 37h32v11H47z" />
      <g transform="translate(27 0) scale(.75 1) translate(-21 0)">
        <path fill={ink} d="M21 20h24v30H21z" />
        <path fill="#845637" d="M22 21h22v27H22z" />
        <path fill="#ae784b" d="M22 21h22v2H22zm0 7h22v2H22zm0 7h22v2H22zm0 7h22v2H22z" />
        <path
          fill="#c9ae70"
          d="M24 24h2v4h-2zm4 0h3v4h-3zm9 0h2v4h-2zm-12 8h3v3h-3zm7-1h3v4h-3zm4 8h4v3h-4z"
        />
        <path fill="#426378" d="M33 24h2v4h-2zm-3 15h3v3h-3z" />
      </g>
      <Chair x={56} y={58} red />
      <path fill="url(#dogmania-floor-rug)" d="M38 92h34v4h5v13h-5v5H38v-5h-5V96h5z" />
      <Chair x={38} y={103} angle={90} />
      <Chair x={73} y={103} angle={-90} />
      <path fill="#644632" d="M51 99h9v2h2v6h-2v2h-9v-2h-2v-6h2z" />
      <path fill={oak} d="M52 100h7v2h2v4h-2v2h-7v-2h-2v-4h2z" />
      <path fill={ink} d="M25 69h53v20H25z" />
      <path fill={oak} d="M26 69h51v15H26z" />
      <path fill="#e0aa6e" d="M26 69h51v2H26z" />
      <Monitor x={45} y={70} />
      <path fill="#dfd4b6" d="M31 73h7v8h-7z" />

      <Frame x={140} y={18} width={32} />
      {[138, 158, 179].map((x) => (
        <Chair key={x} x={x} y={43} />
      ))}
      {[138, 158, 179].map((x) => (
        <Chair key={x} x={x} y={80} angle={180} />
      ))}
      <Chair x={120} y={63} angle={90} />
      <Chair x={195} y={63} angle={-90} />
      <path fill={ink} d="M126 47h64v29h-64z" />
      <path fill={oak} d="M127 47h62v26h-62z" />
      <path fill="#e4aa6d" d="M127 47h62v2h-62zM128 54h21v1h-21zm37 13h22v1h-22z" />
      <path fill="#8b5c3e" d="M127 72h62v2h-62z" />
      <path fill="#ece1c2" d="M135 56h7v9h-7zm37 6h7v5h-7z" />
      <path fill="#455e74" d="M176 52h7v7h-7zM132 68h3v3h-3z" />

      <Frame x={244} y={20} width={16} />
      <path fill={ink} d="M253 32h31v17h-31zm32 7h13v17h-13z" />
      <path fill={oak} d="M254 32h29v8h-29z" />
      <path fill="#7c8a91" d="M254 41h29v7h-29zm32-1h11v15h-11z" />
      <path fill="#abb7b7" d="M288 40h1v14h-1zM262 44h6v1h-6z" />
      <path fill={ink} d="M262 25h11v13h-11z" />
      <path fill="#52899e" d="M263 26h9v3h-9zm2 5h5v4h-5z" />
      <path fill={cream} d="M275 29h3v6h-3zm4 0h3v6h-3z" />
      <Chair x={239} y={66} angle={90} />
      <Chair x={279} y={66} angle={-90} />
      <path fill="#654833" d="M252 61h13v2h5v4h2v8h-3v4h-4v2h-13v-2h-5v-4h-2v-8h3v-4h4z" />
      <path fill={oak} d="M252 62h13v2h4v4h2v6h-3v4h-4v2h-11v-2h-5v-4h-2v-6h3v-4h3z" />
      <path fill={cream} d="M252 69h4v4h-4z" />

      <Frame x={19} y={160} width={14} />
      <path fill={ink} d="M20 177h11v29H20z" />
      <path fill={oak} d="M21 178h9v26h-9z" />
      {[
        [53, 132],
        [106, 132],
        [148, 132],
        [53, 175],
        [106, 175],
        [148, 175],
      ].map(([x, y], index) => (
        <WorkDesk key={index} x={x} y={y} variant={index} />
      ))}
      {[75, 128, 170].map((x) => (
        <Chair key={x} x={x} y={157} />
      ))}
      {[75, 128, 170].map((x) => (
        <Chair key={x} x={x} y={200} />
      ))}
      <path fill="#6c9b9b" d="M101 136h2v31h-2zm43 0h2v31h-2zm-43 42h2v31h-2zm43 0h2v31h-2z" />

      <path fill={ink} d="M232 122h18v25h-18zM265 106h16v25h-16zm17 0h14v31h-14zm3 39h11v47h-11z" />
      <path fill="#9ba8ae" d="M233 123h16v23h-16zm33-16h14v23h-14zm17 0h12v29h-12zm3 39h9v45h-9z" />
      <path fill="#e2e7dc" d="M235 124h12v5h-12zm-1 9h14v3h-14zm1 6h12v4h-12z" />
      <path
        fill="#344a5a"
        d="M236 130h10v2h-10zm32-19h10v3h-10zm0 5h10v3h-10zm0 5h10v3h-10zm16-7h10v20h-10z"
      />
      <path fill="#8fc46d" d="M285 117h4v1h-4zm0 4h3v1h-3zm0 4h5v1h-5zm0 4h4v1h-4z" />
      {[151, 161, 171, 181].map((y) => (
        <path key={y} fill="#617783" d={"M287 " + y + "h7v6h-7z"} />
      ))}

      <Frame x={40} y={229} width={27} />
      <path fill={ink} d="M31 258h57v26H31z" />
      <path fill="#d9cfb5" d="M32 264h39v17H32z" />
      <path fill={oak} d="M72 259h15v23H72z" />
      <path fill="#f0e1c2" d="M32 264h39v3H32z" />
      <Chair x={56} y={254} />

      <path fill="#645b56" d="M130 235h58v56h-58z" />
      <path fill="url(#dogmania-floor-rug)" d="M132 237h54v52h-54z" />
      <Sofa x={137} y={233} />
      <Sofa x={137} y={271} flip />
      <path fill={ink} d="M145 253h34v17h-34z" />
      <path fill={oak} d="M146 253h32v14h-32z" />
      <path fill="#e1ae73" d="M146 253h32v2h-32z" />
      <path fill="#4a7f9a" d="M165 258h7v6h-7z" />
      <path fill={ink} d="M198 232h2v18h4v2h-9v-2h3z" />
      <path fill="#f5d797" d="M195 230h6v4h-6z" />
      <Frame x={216} y={235} width={23} />
      <path fill={ink} d="M214 249h28v15h-28z" />
      <path fill={oak} d="M215 249h26v4h-26z" />
      <path fill="#526a77" d="M215 254h26v8h-26z" />
      <path fill="#324c60" d="M263 263h27v24h-27z" />
      <path fill="#436377" d="M265 265h23v20h-23z" />

      {cornerPlants.map(([x, y]) => (
        <Plant key={x + ":" + y} x={x} y={y} />
      ))}
      <Wall x={6} y={6} width={300} height={8} />
      <Wall x={6} y={294} width={300} height={8} />
      <Wall x={6} y={6} width={8} height={296} />
      <Wall x={298} y={6} width={8} height={296} />
      <WindowPanel x={36} y={7} length={49} />
      <WindowPanel x={123} y={7} length={69} />
      <WindowPanel x={226} y={7} length={52} />
      <WindowPanel x={44} y={295} length={39} />
      <WindowPanel x={112} y={295} length={78} />
      <WindowPanel x={227} y={295} length={20} />
      <WindowPanel x={255} y={295} length={38} />
      {[45, 151, 234, 265].map((y) => (
        <WindowPanel key={y} x={14} y={y} length={28} vertical />
      ))}
      {[50, 154, 225, 257].map((y) => (
        <WindowPanel key={y} x={305} y={y} length={31} vertical />
      ))}
      {officePartitions.map(([x, y, width, height]) => (
        <Wall key={x + ":" + y} x={x} y={y} width={width} height={height} />
      ))}
      {interiorWindows.map(([x, y, length]) => (
        <WindowPanel key={x + ":" + y} x={x} y={y} length={length} />
      ))}
      {officeDoors.map(([x, y, length, axis]) => (
        <Door key={x + ":" + y} x={x} y={y} length={length} vertical={axis === "vertical"} />
      ))}
      {[
        [6, 6],
        [298, 6],
        [6, 294],
        [298, 294],
      ].map(([x, y]) => (
        <Wall key={x + ":" + y} x={x} y={y} width={9} height={9} />
      ))}
    </svg>
  );
}
