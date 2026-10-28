"use client";
import { createContext, useContext, useId } from "react";

const ShadeCtx = createContext("");

export type Gender = "male" | "female";
type Slot = "dress" | "outer" | "top" | "bottom" | "shoes" | "bag" | "other";

/* ---------- utilidades de cor ---------- */
const norm = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (hex: string, target: string, t: number) => {
  const a = toRgb(hex), b = toRgb(target);
  return toHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
};
const darken = (hex: string, t: number) => mix(hex, "#000000", t);
const lighten = (hex: string, t: number) => mix(hex, "#ffffff", t);
const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

// Nome da cor (em português, vindo da análise da IA) -> hex
const COLORS: Array<[RegExp, string]> = [
  [/off.?white|gelo|creme|marfim|perola/, "#ECE6D8"],
  [/branc/, "#F3F2EE"],
  [/preto|black/, "#1E1E21"],
  [/grafite|chumbo/, "#3C3E43"],
  [/cinza|gray|grey/, "#8C8F94"],
  [/prata/, "#B9BCC2"],
  [/bege|nude|areia|palha/, "#D6C2A0"],
  [/caqui|khaki|kaki/, "#B5A576"],
  [/caramelo|camel/, "#B7803E"],
  [/marrom|chocolate|cafe/, "#76503A"],
  [/terracota|ferrugem|tijolo/, "#B5583A"],
  [/vinho|bordo|marsala/, "#6A1F2F"],
  [/vermelh|red/, "#B7262F"],
  [/coral|salmao/, "#E8806B"],
  [/laranja/, "#E07B2D"],
  [/mostarda/, "#C9A227"],
  [/amarel/, "#E6C84A"],
  [/dourad/, "#C9A24B"],
  [/oliva|militar/, "#6B7036"],
  [/verde.*agua|menta|turquesa/, "#4FB3A5"],
  [/verde/, "#2F7A52"],
  [/marinho|navy/, "#1F2F58"],
  [/jeans|denim/, "#3F5F8F"],
  [/azul.*bebe|azul.*claro|celeste/, "#8FB8E0"],
  [/azul|blue/, "#2F5FA8"],
  [/lilas|lavanda/, "#B49AD6"],
  [/roxo|violeta|purpura/, "#6B4AA3"],
  [/rosa|pink|magenta|fucsia/, "#E58DB2"],
];

export function colorFromName(name: string | null | undefined): string {
  const n = norm(name);
  let base = "#9A9CA1";
  for (const [rx, hex] of COLORS) {
    if (rx.test(n)) { base = hex; break; }
  }
  if (/escur/.test(n)) base = darken(base, 0.35);
  else if (/clar|pastel/.test(n)) base = lighten(base, 0.35);
  return base;
}

/* ---------- posição no corpo ---------- */
export function slotOf(category: string | null | undefined): Slot {
  const c = norm(category);
  if (/vestid|macac/.test(c)) return "dress";
  if (/jaqueta|casaco|blazer|moletom|cardig|sobretudo|colete/.test(c)) return "outer";
  if (/camiseta|camisa|blusa|regata|polo|cropped|\btop\b|body/.test(c)) return "top";
  if (/calca|short|bermuda|saia|legging|jeans/.test(c)) return "bottom";
  if (/tenis|sapato|sandalia|bota|chinelo|sapatilha|scarpin/.test(c)) return "shoes";
  if (/bolsa|mochila|mala/.test(c)) return "bag";
  return "other";
}

/* ---------- peça de roupa genérica (cor + padrão + volume) ---------- */
function G({
  d, color, pattern, uid, children, strokeW = 0.45,
}: {
  d: string; color: string; pattern?: string | null; uid: string; children?: React.ReactNode; strokeW?: number;
}) {
  const shade = useContext(ShadeCtx);
  const p = norm(pattern);
  const dark = luminance(color) < 0.5;
  const ink = dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.32)";
  const kind = /listr/.test(p) ? "stripes" : /xadrez|quadric|pied/.test(p) ? "plaid" : /estamp|floral|poa|bolinha|animal/.test(p) ? "dots" : null;
  return (
    <g>
      <path d={d} fill={color} stroke={darken(color, 0.45)} strokeWidth={strokeW} strokeLinejoin="round" />
      {kind && (
        <>
          <defs>
            <pattern id={`${uid}pt`} patternUnits="userSpaceOnUse" width="4" height="4">
              {kind === "stripes" && <rect width="4" height="1.5" fill={ink} />}
              {kind === "plaid" && (<><rect width="4" height="0.9" fill={ink} /><rect width="0.9" height="4" fill={ink} /></>)}
              {kind === "dots" && <circle cx="2" cy="2" r="0.8" fill={ink} />}
            </pattern>
          </defs>
          <path d={d} fill={`url(#${uid}pt)`} />
        </>
      )}
      <path d={d} fill={`url(#${shade})`} />
      {children}
    </g>
  );
}

/* ---------- formas das roupas (coordenadas do manequim masculino) ---------- */
const D = {
  tshirt: "M30 25 Q50 20.5 70 25 L82 33 L77.5 45 L69 41 L69.5 68 Q50 71 30.5 68 L31 41 L22.5 45 L18 33 Z",
  blouse: "M31 25 Q50 21 69 25 L80 33 L76.5 44 L69 40 L68 63 Q50 66 32 63 L31 40 L23.5 44 L20 33 Z",
  shirt:
    "M30 25 Q50 20.5 70 25 L79 32 L81 62 L82 75 L75.5 75 L73 47 L69.5 44 L69.5 71 Q50 74 30.5 71 L30.5 44 L27 47 L24.5 75 L18 75 L19 62 L21 32 Z",
  jacketL: "M30 25 Q39 22 46.5 22.5 L47 80 L30 80 L30.5 48 L27 50 L24.5 78 L16.5 78 L17.5 61 L20 32 Z",
  coatL: "M30 25 Q39 22 46.5 22.5 L47 102 L29 102 L30 48 L27 50 L24.5 78 L16.5 78 L17.5 61 L20 32 Z",
  pants:
    "M35 70 L65 70 L66.5 80 L63.5 150 L52.5 150 L50 88 L47.5 150 L36.5 150 L33.5 80 Z",
  shorts: "M35 70 L65 70 L66.5 80 L64 108 L52 108 L50 90 L48 108 L36 108 L33.5 80 Z",
  skirt: "M37 69 L63 69 L71 114 Q50 119 29 114 Z",
  dress:
    "M36.5 24.5 Q50 22 63.5 24.5 L65.5 40 Q62 50 61.5 59 L73 122 Q50 128 27 122 L38.5 59 Q38 50 34.5 40 Z",
};

// reflete uma forma do lado esquerdo para o direito
const Mirror = ({ children }: { children: React.ReactNode }) => (
  <g transform="translate(100 0) scale(-1 1)">{children}</g>
);

/* ---------- manequim ---------- */
function Body({ gender, uid }: { gender: Gender; uid: string }) {
  const male = gender === "male";
  const arm = male
    ? "M29 25 Q24 27 23 34 L20 58 Q19 64 19 70 L18 84 Q20 88 23 86 L25 72 Q26 64 28 58 L32 40 Z"
    : "M33 25 Q28 27 27.5 34 L24 58 Q23 64 23.5 70 L22 84 Q24 87.5 26.5 85.5 L28 72 Q29 64 31 58 L34 40 Z";
  const torso = male
    ? "M29 25 Q50 20 71 25 L69 40 Q66 52 63 60 L64 73 Q50 77 36 73 L37 60 Q34 52 31 40 Z"
    : "M33 25 Q50 21 67 25 L66 38 Q64 46 59.5 54 Q57 58 61 64 Q67 70 67 75 Q50 80 33 75 Q33 70 39 64 Q43 58 40.5 54 Q36 46 34 38 Z";
  const leg = male
    ? "M36 73 L50 74 L49 100 Q48 112 47.5 126 L47 153 L39 153 L38.5 126 Q38 112 36.5 100 Z"
    : "M33.5 75 L50 76 L49 100 Q48 112 47.5 126 L47 153 L40.5 153 L40 126 Q38 112 34.5 100 Z";
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}body`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#0A0A0B" />
          <stop offset="0.3" stopColor="#3D4046" />
          <stop offset="0.5" stopColor="#1A1B1E" />
          <stop offset="1" stopColor="#060607" />
        </linearGradient>
      </defs>
      <g fill={`url(#${uid}body)`}>
        <path d="M50 1.5 C55.5 1.5 57 6.5 57 11 C57 15.5 54.5 19 50 19.5 C45.5 19 43 15.5 43 11 C43 6.5 44.5 1.5 50 1.5 Z" />
        <rect x="46.5" y="18" width="7" height="8" rx="2" />
        <path d={torso} />
        <path d={arm} />
        <Mirror><path d={arm} /></Mirror>
        <path d={leg} />
        <Mirror><path d={leg} /></Mirror>
      </g>
      {/* brilho do plástico */}
      <ellipse cx="47.3" cy="7" rx="1.6" ry="3.4" fill="#fff" opacity="0.22" />
      <path d="M39 30 Q41 40 40 52" stroke="#fff" strokeWidth="1.1" opacity="0.07" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Shoes({ kind, color, uid }: { kind: string; color: string; uid: string }) {
  const k = norm(kind);
  const isBoot = /bota/.test(k);
  const isSandal = /sandalia|chinelo/.test(k);
  const isSneaker = /tenis/.test(k);
  const sole = isSneaker ? "#F4F3EF" : "#1C1C1E";
  const one = isBoot
    ? "M38 138 L47.5 138 L48.5 152 L50 156 Q50.4 159 47.5 159 L36 159 Q33.5 159 33.6 156.5 L38 152 Z"
    : "M38.5 151 L47.5 151 L49.5 155.5 Q50 158.8 47.5 158.8 L35.8 158.8 Q33.4 158.8 33.6 156.4 Z";
  if (isSandal) {
    const skin = "#DCC9B0";
    return (
      <g>
        {[0, 1].map((i) => {
          const W = ({ children }: { children: React.ReactNode }) => (i ? <Mirror>{children}</Mirror> : <g>{children}</g>);
          return (
            <W key={i}>
              <path d="M37 157.4 L48.5 157.4 L49.6 159 L35.8 159 Z" fill={color} stroke={darken(color, 0.5)} strokeWidth="0.4" />
              <path d="M39.5 156.5 L46.5 153 M39.5 154 L46.5 153" stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <path d="M41 154 Q43 151 45 154" stroke={skin} strokeWidth="0.01" fill="none" />
            </W>
          );
        })}
      </g>
    );
  }
  const Pair = (
    <>
      <G d={one} color={color} uid={uid} />
      <rect x="33.6" y="157.1" width="16" height="1.8" rx="0.8" fill={sole} stroke="#00000033" strokeWidth="0.25" />
    </>
  );
  return (
    <g>
      {Pair}
      <Mirror>{Pair}</Mirror>
    </g>
  );
}

function Bag({ color, uid, kind }: { color: string; uid: string; kind: string }) {
  const backpack = /mochila/.test(norm(kind));
  if (backpack) {
    return (
      <g>
        <G d="M60 28 Q66 26 72 30 L74 62 Q67 66 59 62 Z" color={color} uid={uid} />
        <path d="M62 30 L58 44" stroke={darken(color, 0.4)} strokeWidth="1" fill="none" />
      </g>
    );
  }
  return (
    <g>
      <path d="M66 27 Q74 50 79 70" stroke={darken(color, 0.4)} strokeWidth="1" fill="none" strokeLinecap="round" />
      <G d="M71 70 L87 70 L89 90 Q80 93 69 90 Z" color={color} uid={uid}>
        <path d="M71.5 74 L88 74" stroke={darken(color, 0.35)} strokeWidth="0.5" />
      </G>
    </g>
  );
}

/* ---------- peça completa por categoria ---------- */
function Piece({ item, slot, gender, uid }: { item: any; slot: Slot; gender: Gender; uid: string }) {
  const cat = norm(item?.category);
  const color = colorFromName(item?.color);
  const pattern = item?.pattern;
  const f = gender === "female";
  const upper = f ? "translate(50 0) scale(0.84 1) translate(-50 0)" : undefined;
  const lower = f ? "translate(50 0) scale(1.05 1) translate(-50 0)" : undefined;
  const edge = darken(color, 0.4);
  const lite = luminance(color) < 0.5 ? lighten(color, 0.45) : darken(color, 0.3);

  if (slot === "dress")
    return (
      <G d={D.dress} color={color} pattern={pattern} uid={uid}>
        <path d="M43 23 Q50 30 57 23" stroke={edge} strokeWidth="0.5" fill="none" />
        <path d="M38.5 59 Q50 63 61.5 59" stroke={edge} strokeWidth="0.4" fill="none" />
      </G>
    );

  if (slot === "top") {
    const isShirt = /camisa(?!.*camiseta)/.test(cat) && !/camiseta/.test(cat);
    const isBlouse = /blusa|cropped|top|regata|body/.test(cat);
    return (
      <g transform={upper}>
        <G d={isShirt ? D.shirt : isBlouse ? D.blouse : D.tshirt} color={color} pattern={pattern} uid={uid}>
          {isShirt ? (
            <>
              <path d="M44.5 21.5 L50 30 L55.5 21.5 L53.5 20.5 L50 25 L46.5 20.5 Z" fill={lighten(color, 0.12)} stroke={edge} strokeWidth="0.35" />
              <path d="M50 30 L50 71" stroke={edge} strokeWidth="0.4" />
              {[36, 44, 52, 60].map((y) => (<circle key={y} cx="51.6" cy={y} r="0.55" fill={lite} />))}
            </>
          ) : (
            <path d="M42.5 22.4 Q50 30.5 57.5 22.4" stroke={edge} strokeWidth="0.5" fill="none" />
          )}
        </G>
      </g>
    );
  }

  if (slot === "outer") {
    const long = /casaco|sobretudo/.test(cat);
    const L = long ? D.coatL : D.jacketL;
    return (
      <g transform={upper}>
        <G d={L} color={color} pattern={pattern} uid={uid + "L"} />
        <Mirror><G d={L} color={color} pattern={pattern} uid={uid + "R"} /></Mirror>
        <path d="M46.5 23 L46.5 80 M53.5 23 L53.5 80" stroke={edge} strokeWidth="0.35" fill="none" transform={long ? "scale(1 1.2)" : undefined} />
        <path d="M44 21.5 L40 29 L46.5 33 M56 21.5 L60 29 L53.5 33" fill={lighten(color, 0.08)} stroke={edge} strokeWidth="0.4" />
      </g>
    );
  }

  if (slot === "bottom") {
    const shorts = /short|bermuda/.test(cat);
    const skirt = /saia/.test(cat);
    const d = skirt ? D.skirt : shorts ? D.shorts : D.pants;
    return (
      <g transform={skirt ? undefined : lower}>
        <G d={d} color={color} pattern={pattern} uid={uid}>
          <path d={skirt ? "M37 72 Q50 75 63 72" : "M34.6 74 Q50 77 65.4 74"} stroke={edge} strokeWidth="0.5" fill="none" />
        </G>
      </g>
    );
  }

  if (slot === "shoes") return <Shoes kind={item?.category} color={color} uid={uid} />;
  if (slot === "bag") return <Bag color={color} uid={uid} kind={item?.category} />;
  return null;
}

/* ---------- figura completa ---------- */
export function MannequinFigure({ items, gender }: { items: any[]; gender: Gender }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const slots: Partial<Record<Slot, any>> = {};
  for (const oi of items ?? []) {
    const s = slotOf(oi?.wardrobeItem?.category);
    if (s !== "other" && !slots[s]) slots[s] = oi?.wardrobeItem;
  }
  const hasDress = !!slots.dress;
  // ordem de desenho: de trás para a frente
  const order: Slot[] = ["bottom", "shoes", "top", "dress", "outer", "bag"];

  return (
    <ShadeCtx.Provider value={`${uid}shade`}>
    <svg viewBox="0 0 100 170" className="absolute inset-0 w-full h-full" role="img" aria-label="Look no manequim">
      <defs>
        <linearGradient id={`${uid}shade`} gradientUnits="userSpaceOnUse" x1="14" x2="86" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.24" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="0.62" stopColor="#000" stopOpacity="0.03" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`${uid}floor`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#D5D4D2" />
          <stop offset="1" stopColor="#C4C3C1" />
        </linearGradient>
      </defs>
      <rect width="100" height="170" fill="#E4E3E1" />
      <rect y="156" width="100" height="14" fill={`url(#${uid}floor)`} />
      <ellipse cx="50" cy="161" rx="30" ry="2.6" fill="#000" opacity="0.14" />
      <rect x="24" y="159.2" width="52" height="3" rx="1" fill="#2B2B2E" />
      <Body gender={gender} uid={uid} />
      {order.map((slot) => {
        if (hasDress && (slot === "top" || slot === "bottom")) return null;
        const it = slots[slot];
        return it ? <Piece key={slot} item={it} slot={slot} gender={gender} uid={`${uid}${slot}`} /> : null;
      })}
    </svg>
    </ShadeCtx.Provider>
  );
}
