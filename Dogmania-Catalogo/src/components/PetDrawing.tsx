export type PetDrawingKind =
  "paw" | "dog" | "cat" | "bird" | "fish" | "rabbit" | "bowl" | "bath" | "play";

function DogFace() {
  return (
    <>
      <g className="pet-ear pet-ear-left">
        <path d="M19 20C7 12 5 35 14 39l9-12" fill="#f3bc57" />
      </g>
      <g className="pet-ear pet-ear-right">
        <path d="M45 20c12-8 14 15 5 19l-9-12" fill="#f3bc57" />
      </g>
      <path d="M16 28c0-15 32-15 32 0v14c0 17-32 17-32 0Z" fill="#fff5dc" />
      <path d="M18 28c-1-9 12-10 12-1v8c0 8-12 6-12-1" fill="#f4ca7b" stroke="none" />
      <g className="pet-eyes" fill="currentColor" stroke="none">
        <ellipse cx="25" cy="32" rx="2.2" ry="2.8" />
        <ellipse cx="40" cy="32" rx="2.2" ry="2.8" />
      </g>
      <path d="M28 40q4-4 8 0l-4 4Z" fill="currentColor" strokeLinejoin="round" />
      <path d="M32 44v3m-6-2q6 7 12 0" fill="none" />
      <path className="pet-tongue" d="M30 49v3q3 5 6 0v-3" fill="#f29a9f" />
    </>
  );
}

function CatFace() {
  return (
    <>
      <g className="pet-ear pet-ear-left">
        <path d="m15 30-2-17 15 9" fill="#dfeafa" />
        <path d="m17 24-1-6 7 5" fill="#f1afaa" stroke="none" />
      </g>
      <g className="pet-ear pet-ear-right">
        <path d="m49 30 2-17-15 9" fill="#dfeafa" />
        <path d="m47 24 1-6-7 5" fill="#f1afaa" stroke="none" />
      </g>
      <path d="M13 36c0-23 38-23 38 0v4c0 21-38 21-38 0Z" fill="#ecf2ff" />
      <path d="m26 20 2 6m4-7v6m6-5-2 6" fill="none" opacity=".6" />
      <g className="pet-eyes" fill="currentColor" stroke="none">
        <ellipse cx="24" cy="35" rx="2.2" ry="2.8" />
        <ellipse cx="40" cy="35" rx="2.2" ry="2.8" />
      </g>
      <path d="m29 42 3 3 3-3Z" fill="#ef9da7" />
      <path d="M32 45q-3 5-6 1m6-1q3 5 6 1" fill="none" />
      <path className="pet-whiskers" d="m18 42-9-2m9 6-9 1m37-5 9-2m-9 6 9 1" fill="none" />
    </>
  );
}

export function PetDrawing({ kind }: { kind: PetDrawingKind }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pet-drawing pet-drawing--${kind}`}
      aria-hidden="true"
      focusable="false"
    >
      {(kind === "dog" || kind === "bowl" || kind === "play") && (
        <g transform={kind === "dog" ? undefined : "translate(6 -2) scale(.8)"}>
          <DogFace />
        </g>
      )}
      {(kind === "cat" || kind === "bath") && (
        <g transform={kind === "cat" ? undefined : "translate(3 5) scale(.85)"}>
          <CatFace />
        </g>
      )}
      {kind === "bird" && (
        <>
          <path className="pet-bird-tail" d="m18 41-12 5 12 5 7-6" fill="#f4c469" />
          <path d="M47 31c0 30-35 31-35 7 0-19 27-29 35-7Z" fill="#d9ebff" />
          <path d="m46 28 12 6-13 5" fill="#efb54a" />
          <path className="pet-bird-wing" d="M19 36c17-9 22 5 7 10-4 1-9-3-7-10Z" fill="#93b7e8" />
          <circle className="pet-eyes" cx="38" cy="27" r="2.5" fill="currentColor" stroke="none" />
          <path d="M28 54v5m9-6v6m-12 0h7m2 0h7" />
          <path d="m27 15-2-6m5 5 3-6" />
        </>
      )}
      {kind === "fish" && (
        <>
          <path className="pet-fish-tail" d="m23 32-16-12v24Z" fill="#f3c367" />
          <path d="m29 22 8-11 7 12m-15 21 8 9 6-9" fill="#f3c367" />
          <ellipse cx="36" cy="33" rx="19" ry="15" fill="#d9eaff" />
          <path d="M34 24q-6 9 0 18m-6-15q-4 6 0 12" opacity=".5" />
          <circle className="pet-eyes" cx="45" cy="29" r="2.5" fill="currentColor" stroke="none" />
          <path d="M49 37q3 2 5-1" />
          <circle className="pet-bubble pet-bubble-one" cx="53" cy="13" r="3" fill="#fff" />
          <circle className="pet-bubble pet-bubble-two" cx="59" cy="6" r="2" fill="#fff" />
        </>
      )}
      {kind === "rabbit" && (
        <>
          <g className="pet-ear pet-ear-left">
            <ellipse cx="23" cy="22" rx="7" ry="17" fill="#fff4df" transform="rotate(-12 23 22)" />
            <path d="m21 12 4 15" stroke="#e6a7a3" strokeWidth="4" />
          </g>
          <g className="pet-ear pet-ear-right">
            <ellipse cx="41" cy="22" rx="7" ry="17" fill="#fff4df" transform="rotate(12 41 22)" />
            <path d="m43 12-4 15" stroke="#e6a7a3" strokeWidth="4" />
          </g>
          <ellipse cx="32" cy="43" rx="21" ry="16" fill="#fff4df" />
          <g className="pet-eyes" fill="currentColor" stroke="none">
            <circle cx="24" cy="41" r="2.2" />
            <circle cx="40" cy="41" r="2.2" />
          </g>
          <path d="m29 47 3 3 3-3Z" fill="#efa5a8" />
          <path d="M32 50v4m-4-2q4 4 8 0" />
        </>
      )}
      {kind === "bowl" && (
        <>
          <path d="m13 46 5 13h29l5-13Z" fill="#f3c367" />
          <ellipse cx="32.5" cy="46" rx="19.5" ry="4" fill="#fff4df" />
          <path d="M28 50h9" />
        </>
      )}
      {kind === "bath" && (
        <>
          <circle className="pet-bubble pet-bubble-one" cx="47" cy="12" r="6" fill="#e0efff" />
          <circle className="pet-bubble pet-bubble-two" cx="56" cy="24" r="4" fill="#e0efff" />
          <path d="M49 9h1m7 13h1" stroke="#fff" strokeWidth="2.5" />
        </>
      )}
      {kind === "play" && (
        <g className="pet-ball">
          <circle cx="45" cy="48" r="12" fill="#f3c367" />
          <path d="M34 44q16 1 16 15m-11-22q-3 13 16 16" />
        </g>
      )}
      {kind === "paw" && (
        <>
          <ellipse cx="16" cy="25" rx="6" ry="8" fill="#dce9ff" transform="rotate(-28 16 25)" />
          <ellipse cx="28" cy="17" rx="6" ry="8" fill="#f5ca78" />
          <ellipse cx="41" cy="20" rx="6" ry="8" fill="#dce9ff" transform="rotate(18 41 20)" />
          <ellipse cx="50" cy="31" rx="6" ry="8" fill="#f5ca78" transform="rotate(36 50 31)" />
          <path
            d="M18 44c4-4 5-12 13-12 7 0 9 9 14 14 9 12-9 9-14 7-9 5-22 2-13-9Z"
            fill="#e1ecff"
          />
        </>
      )}
    </svg>
  );
}
