"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MannequinFigure, type Gender } from "@/components/mannequin-figure";

const STORAGE_KEY = "stylewise_mannequin_gender";

const norm = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Palpite inicial: se o look tem vestido/saia/blusa, começa no manequim feminino
function guessGender(items: any[]): Gender {
  const feminine = (items ?? []).some((oi) =>
    /vestid|saia|blusa|cropped|body|sandalia|scarpin|sapatilha/.test(norm(oi?.wardrobeItem?.category))
  );
  return feminine ? "female" : "male";
}

export function OutfitView({ items }: { items: any[] }) {
  const [mode, setMode] = useState<"mannequin" | "pieces">("mannequin");
  const [gender, setGender] = useState<Gender>(() => guessGender(items));

  // Lembra a escolha do usuário entre os looks
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "male" || saved === "female") setGender(saved);
    } catch {}
  }, []);

  const chooseGender = (g: Gender) => {
    setGender(g);
    try { localStorage.setItem(STORAGE_KEY, g); } catch {}
  };

  const ordered = [...(items ?? [])].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

  const pill = (active: boolean) =>
    cn(
      "px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
      active ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
    );

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex gap-1 p-0.5 bg-muted rounded-full w-fit">
          <button onClick={() => setMode("mannequin")} className={pill(mode === "mannequin")}>Manequim</button>
          <button onClick={() => setMode("pieces")} className={pill(mode === "pieces")}>Peças</button>
        </div>
        {mode === "mannequin" && (
          <div className="flex gap-1 p-0.5 bg-muted rounded-full w-fit">
            <button onClick={() => chooseGender("male")} className={pill(gender === "male")}>Masc.</button>
            <button onClick={() => chooseGender("female")} className={pill(gender === "female")}>Fem.</button>
          </div>
        )}
      </div>

      {mode === "mannequin" && (
        <div
          className="relative mx-auto w-full max-w-[240px] rounded-2xl overflow-hidden"
          style={{ aspectRatio: "100 / 170" }}
        >
          <MannequinFigure items={ordered} gender={gender} />
        </div>
      )}

      {/* Fotos reais das peças: miniaturas no manequim, maiores na aba "Peças" */}
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
