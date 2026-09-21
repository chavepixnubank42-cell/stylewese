"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SafeDate } from "@/components/safe-format";

export function FavoritesClient() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites").then((r) => r.json()).then((d) => {
      setFavorites(d?.favorites ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const removeFav = async (outfitId: string) => {
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId }),
      });
      setFavorites((p: any[]) => (p ?? []).filter((f: any) => f?.outfitId !== outfitId));
      toast.success("Removido dos favoritos");
    } catch {}
  };

  return (
    <div className="px-5 pt-8 pb-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold">Meus Favoritos</h1>
        <p className="text-muted-foreground text-xs">{favorites?.length ?? 0} looks salvos</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((n: number) => <div key={n} className="h-36 rounded-2xl bg-muted shimmer" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum look salvo ainda</p>
          <p className="text-muted-foreground text-xs mt-1">Crie combinações e salve seus favoritos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav: any, idx: number) => {
            const outfit = fav?.outfit;
            return (
              <motion.div
                key={fav?.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl p-5 shadow-sm relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{outfit?.name ?? "Look"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {(outfit?.items?.length ?? 0)} peças · {outfit?.style ?? ""}
                      {fav?.createdAt && (
                        <> · Salvo em <SafeDate date={fav.createdAt} options={{ day: "numeric", month: "short", year: "numeric" }} /></>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFav(fav?.outfitId)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(outfit?.items ?? []).map((oi: any) => (
                    <div key={oi?.id} className="w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={oi?.wardrobeItem?.imageUrl ?? ""} alt={oi?.wardrobeItem?.category ?? ""} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {outfit?.explanation && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{outfit.explanation}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
