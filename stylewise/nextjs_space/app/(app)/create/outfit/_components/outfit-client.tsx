"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, ThumbsUp, ThumbsDown, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingAnalysis } from "@/components/loading-analysis";
import { OCCASIONS, STYLES } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function OutfitClient() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [occasion, setOccasion] = useState("Casual");
  const [style, setStyle] = useState("Casual");
  const [step, setStep] = useState<"select" | "config" | "generating" | "results">("select");
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wardrobe").then((r) => r.json()).then((d) => {
      setItems(d?.items ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedItem) { toast.error("Selecione uma peça base"); return; }
    setStep("generating");
    try {
      const res = await fetch("/api/generate-outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseItemId: selectedItem.id, occasion, style }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = "";
      if (!reader) { setStep("config"); return; }

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
              } else if (parsed?.status === "error") {
                throw new Error(parsed?.message);
              }
            } catch {}
          }
        }
      }
    } catch {
      toast.error("Erro ao gerar looks");
      setStep("config");
    }
  };

  const handleRate = async (outfitId: string, liked: boolean) => {
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId, liked }),
      });
      setOutfits((prev: any[]) =>
        (prev ?? []).map((o: any) => o?.id === outfitId ? { ...(o ?? {}), rating: liked } : o)
      );
      toast.success(liked ? "Adorou! 👍" : "Anotado 👎");
    } catch {}
  };

  const handleFavorite = async (outfitId: string) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId }),
      });
      const data = await res.json();
      setOutfits((prev: any[]) =>
        (prev ?? []).map((o: any) => o?.id === outfitId ? { ...(o ?? {}), isFavorited: data?.favorited } : o)
      );
      toast.success(data?.favorited ? "Salvo nos favoritos!" : "Removido dos favoritos");
    } catch {}
  };

  return (
    <div className="px-5 pt-8 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/home" className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="font-display text-xl font-bold">Monte seu look</h1>
          <p className="text-muted-foreground text-xs">Selecione uma peça e crie combinações</p>
        </div>
      </div>

      {step === "select" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm font-medium mb-3">Escolha a peça base:</p>
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6].map((n: number) => <div key={n} className="aspect-square rounded-xl bg-muted shimmer" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">Adicione peças ao guarda-roupa primeiro</p>
              <Link href="/wardrobe">
                <Button variant="outline" size="sm" className="mt-3 rounded-xl">Ir para guarda-roupa</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {items.map((item: any) => (
                  <button
                    key={item?.id}
                    onClick={() => { setSelectedItem(item); setStep("config"); }}
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      selectedItem?.id === item?.id ? "border-[#C8A96B]" : "border-transparent"
                    )}
                  >
                    <img src={item?.imageUrl ?? ""} alt={item?.category ?? ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {step === "config" && selectedItem && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-sm">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
              <img src={selectedItem?.imageUrl ?? ""} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-medium text-sm">{selectedItem?.category}</p>
              <p className="text-xs text-muted-foreground">{selectedItem?.color} · {selectedItem?.style ?? ""}</p>
            </div>
            <button onClick={() => setStep("select")} className="ml-auto text-xs text-[#C8A96B]">Trocar</button>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Ocasião</label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o: string) => (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    occasion === o ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >{o}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Estilo</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s: string) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    style === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >{s}</button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full rounded-xl h-12 gap-2">
            <Sparkles className="w-4 h-4" /> Criar combinações
          </Button>
        </motion.div>
      )}

      {step === "generating" && <LoadingAnalysis message="Criando combinações..." />}

      {step === "results" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <p className="text-sm font-medium">{outfits?.length ?? 0} looks criados</p>
          {(outfits ?? []).map((outfit: any, idx: number) => (
            <motion.div
              key={outfit?.id ?? idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-semibold text-sm mb-3">{outfit?.name ?? `Look ${idx + 1}`}</h3>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {(outfit?.items ?? []).map((oi: any) => (
                  <div key={oi?.id} className="w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={oi?.wardrobeItem?.imageUrl ?? ""} alt={oi?.wardrobeItem?.category ?? ""} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {outfit?.explanation && (
                <p className="text-xs text-muted-foreground mb-3">{outfit.explanation}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleRate(outfit?.id, true)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    outfit?.rating === true ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                  )}
                ><ThumbsUp className="w-3.5 h-3.5" /></button>
                <button
                  onClick={() => handleRate(outfit?.id, false)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    outfit?.rating === false ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                  )}
                ><ThumbsDown className="w-3.5 h-3.5" /></button>
                <button
                  onClick={() => handleFavorite(outfit?.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ml-auto",
                    outfit?.isFavorited ? "bg-[#C8A96B]/20 text-[#C8A96B]" : "bg-muted text-muted-foreground"
                  )}
                ><Heart className={cn("w-3.5 h-3.5", outfit?.isFavorited && "fill-current")} /> Salvar</button>
              </div>
            </motion.div>
          ))}
          <Button onClick={() => { setStep("config"); setOutfits([]); }} variant="outline" className="w-full rounded-xl h-11">
            Gerar novas combinações
          </Button>
        </motion.div>
      )}
    </div>
  );
}
