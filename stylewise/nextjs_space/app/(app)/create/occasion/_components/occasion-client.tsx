"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingAnalysis } from "@/components/loading-analysis";
import { OCCASIONS } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function OccasionClient() {
  const [occasion, setOccasion] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [step, setStep] = useState<"input" | "generating" | "results">("input");
  const [outfits, setOutfits] = useState<any[]>([]);

  const handleGenerate = async () => {
    const occ = customOccasion || occasion;
    if (!occ) { toast.error("Descreva a ocasião"); return; }
    setStep("generating");
    try {
      const res = await fetch("/api/generate-outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion: occ, mode: "occasion" }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = "";
      if (!reader) { setStep("input"); return; }
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split("\n");
        partialRead = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed?.status === "completed") {
                setOutfits(parsed?.result?.outfits ?? []);
                setStep("results");
                return;
              } else if (parsed?.status === "error") throw new Error();
            } catch {}
          }
        }
      }
    } catch {
      toast.error("Erro ao gerar looks");
      setStep("input");
    }
  };

  const handleRate = async (outfitId: string, liked: boolean) => {
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId, liked }),
    }).catch(() => {});
    setOutfits((p: any[]) => (p ?? []).map((o: any) => o?.id === outfitId ? { ...(o ?? {}), rating: liked } : o));
  };

  const handleFavorite = async (outfitId: string) => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setOutfits((p: any[]) => (p ?? []).map((o: any) => o?.id === outfitId ? { ...(o ?? {}), isFavorited: data?.favorited } : o));
  };

  return (
    <div className="px-5 pt-8 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/home" className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="font-display text-xl font-bold">Tenho uma ocasião</h1>
          <p className="text-muted-foreground text-xs">Descreva e receba sugestões</p>
        </div>
      </div>

      {step === "input" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Ocasião pré-definida</label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o: string) => (
                <button
                  key={o}
                  onClick={() => { setOccasion(o); setCustomOccasion(""); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    occasion === o && !customOccasion ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >{o}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Ou descreva sua ocasião</label>
            <Input
              placeholder="Ex: Jantar romântico sábado à noite"
              value={customOccasion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setCustomOccasion(e.target.value); setOccasion(""); }}
              className="rounded-xl h-12"
            />
          </div>
          <Button onClick={handleGenerate} className="w-full rounded-xl h-12 gap-2" disabled={!occasion && !customOccasion}>
            <Sparkles className="w-4 h-4" /> Gerar sugestões
          </Button>
        </motion.div>
      )}

      {step === "generating" && <LoadingAnalysis message="Criando looks para sua ocasião..." />}

      {step === "results" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <p className="text-sm font-medium">{outfits?.length ?? 0} looks sugeridos</p>
          {(outfits ?? []).map((outfit: any, idx: number) => (
            <motion.div key={outfit?.id ?? idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-card rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">{outfit?.name ?? `Look ${idx + 1}`}</h3>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {(outfit?.items ?? []).map((oi: any) => (
                  <div key={oi?.id} className="w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={oi?.wardrobeItem?.imageUrl ?? ""} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {outfit?.explanation && <p className="text-xs text-muted-foreground mb-3">{outfit.explanation}</p>}
              <div className="flex gap-2">
                <button onClick={() => handleRate(outfit?.id, true)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", outfit?.rating === true ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground")}><ThumbsUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleRate(outfit?.id, false)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", outfit?.rating === false ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground")}><ThumbsDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleFavorite(outfit?.id)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors ml-auto", outfit?.isFavorited ? "bg-[#C8A96B]/20 text-[#C8A96B]" : "bg-muted text-muted-foreground")}><Heart className={cn("w-3.5 h-3.5", outfit?.isFavorited && "fill-current")} /> Salvar</button>
              </div>
            </motion.div>
          ))}
          <Button onClick={() => { setStep("input"); setOutfits([]); }} variant="outline" className="w-full rounded-xl h-11">Nova busca</Button>
        </motion.div>
      )}
    </div>
  );
}
