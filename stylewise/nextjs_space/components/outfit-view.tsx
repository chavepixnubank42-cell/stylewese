"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Slot = "dress" | "outer" | "top" | "bottom" | "shoes" | "bag" | "accessory";

const norm = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Descobre em que parte do corpo cada categoria do guarda-roupa vai
function slotOf(category: string | null | undefined): Slot {
  const c = norm(category);
  if (/vestid|macac/.test(c)) return "dress";
  if (/jaqueta|casaco|blazer|moletom|cardig|sobretudo|colete/.test(c)) return "outer";
  if (/camiseta|camisa|blusa|regata|polo|cropped|\btop\b|body/.test(c)) return "top";
  if (/calca|short|bermuda|saia|legging|jeans/.test(c)) return "bottom";
  if (/tenis|sapato|sandalia|bota|chinelo|sapatilha|scarpin/.test(c)) return "shoes";
  if (/bolsa|mochila|mala/.test(c)) return "bag";
  return "accessory";
}

// Posição de cada peça no palco, em % (palco com proporção 100 x 166)
type Box = { left: number; top: number; width: number; height: number; z: number };

function layoutFor(slots: Partial<Record<Slot, any>>): Partial<Record<Slot, Box>> {
  const hasDress = !!slots.dress;
  const hasOuter = !!slots.outer;
  const hasTop = !!slots.top;
  const boxes: Partial<Record<Slot, Box>> = {};

  if (hasDress) {
    boxes.dress = { left: 19, top: 17, width: 62, height: 52, z: 2 };
  } else {
    if (hasTop) {
      // Com casaco por cima, a camiseta aparece um pouco mais baixa para "espiar"
      boxes.top = hasOuter
        ? { left: 24, top: 21, width: 52, height: 27, z: 1 }
        : { left: 19, top: 17, width: 62, height: 31, z: 2 };
    }
    if (slots.bottom) boxes.bottom = { left: 24, top: 45, width: 52, height: 41, z: 1 };
  }
  if (hasOuter) {
    boxes.outer = hasTop || hasDress
      ? { left: 13, top: 16, width: 74, height: 33, z: 3 }
      : { left: 15, top: 16, width: 70, height: 34, z: 3 };
  }
  if (slots.shoes) boxes.shoes = { left: 27, top: 82, width: 46, height: 14, z: 2 };
  if (slots.bag) boxes.bag = { left: 70, top: 46, width: 28, height: 22, z: 4 };
  if (slots.accessory) boxes.accessory = { left: 2, top: 30, width: 24, height: 18, z: 4 };
  return boxes;
}

function MannequinSvg() {
  return (
    <svg viewBox="0 0 100 166" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <g fill="#DDD6CA" stroke="#CFC7B9" strokeWidth="0.6" strokeLinejoin="round">
        {/* cabeça e pescoço */}
        <ellipse cx="50" cy="9.5" rx="6.2" ry="7.6" />
        <rect x="46.8" y="15.5" width="6.4" height="5" rx="2" />
        {/* tronco */}
        <path d="M30 22 Q50 18 70 22 L72 36 Q70 46 66 56 L65 70 Q50 74 35 70 L34 56 Q30 46 28 36 Z" />
        {/* braços */}
        <path d="M30 22 L24 24 Q18 40 16 62 L15 82 Q17 85 20 82 L24 62 Q27 46 30 36 Z" />
        <path d="M70 22 L76 24 Q82 40 84 62 L85 82 Q83 85 80 82 L76 62 Q73 46 70 36 Z" />
        {/* pernas */}
        <path d="M35 70 L49 70 L48 112 L47 146 Q47 149 43 149 L38 149 Q36 149 36.5 146 L38 112 Z" />
        <path d="M51 70 L65 70 L62 112 L63.5 146 Q64 149 62 149 L57 149 Q53 149 53 146 L52 112 Z" />
      </g>
    </svg>
  );
}

export function OutfitView({ items }: { items: any[] }) {
  const [mode, setMode] = useState<"mannequin" | "pieces">("mannequin");

  const ordered = [...(items ?? [])].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

  // Uma peça por posição do corpo (a primeira que a IA listou)
  const slots: Partial<Record<Slot, any>> = {};
  for (const oi of ordered) {
    const slot = slotOf(oi?.wardrobeItem?.category);
    if (!slots[slot]) slots[slot] = oi;
  }
  const boxes = layoutFor(slots);
  const placed = (Object.keys(boxes) as Slot[]).filter((s) => slots[s]);

  return (
    <div className="mb-3">
      <div className="flex gap-1 mb-3 p-0.5 bg-muted rounded-full w-fit">
        {([
          ["mannequin", "Manequim"],
          ["pieces", "Peças"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
              mode === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "mannequin" ? (
        <div
          className="relative mx-auto w-full max-w-[230px] rounded-2xl overflow-hidden"
          style={{ aspectRatio: "100 / 166", background: "#F1EDE6" }}
        >
          <MannequinSvg />
          {placed.map((slot, i) => {
            const b = boxes[slot]!;
            const item = slots[slot]?.wardrobeItem;
            return (
              <motion.img
                key={slots[slot]?.id ?? slot}
                src={item?.imageUrl ?? ""}
                alt={item?.category ?? ""}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="absolute object-contain mix-blend-multiply"
                style={{
                  left: `${b.left}%`,
                  top: `${b.top}%`,
                  width: `${b.width}%`,
                  height: `${b.height}%`,
                  zIndex: b.z,
                }}
              />
            );
          })}
        </div>
      ) : null}

      {/* Miniaturas das peças (sempre visíveis; na aba "Peças" ficam maiores) */}
      <div className={cn("flex gap-2 overflow-x-auto pb-2", mode === "mannequin" ? "mt-3" : "")}>
        {ordered.map((oi: any) => (
          <div
            key={oi?.id}
            className={cn(
              "rounded-lg overflow-hidden bg-muted shrink-0",
              mode === "pieces" ? "w-24 h-32" : "w-12 h-14"
            )}
          >
            <img
              src={oi?.wardrobeItem?.imageUrl ?? ""}
              alt={oi?.wardrobeItem?.category ?? ""}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
