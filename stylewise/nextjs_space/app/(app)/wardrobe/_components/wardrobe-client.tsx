"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Shirt, Trash2, Edit3, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { LoadingAnalysis } from "@/components/loading-analysis";
import { CATEGORIES } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WardrobeClient() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addStep, setAddStep] = useState<"upload" | "analyzing" | "result">("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/wardrobe");
      const data = await res.json();
      setItems(data?.items ?? []);
    } catch { toast.error("Erro ao carregar peças"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) return;
    setAddStep("analyzing");
    try {
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: selectedFile.name, contentType: selectedFile.type, isPublic: false }),
      });
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      const fileUrlRes = await fetch("/api/wardrobe/file-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudStoragePath: cloud_storage_path, contentType: selectedFile.type, isPublic: false }),
      });
      const { url: imageUrl } = await fileUrlRes.json();

      const analyzeRes = await fetch("/api/wardrobe/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const aiAnalysis = await analyzeRes.json();

      setAnalysis({ ...aiAnalysis, imageUrl, cloudStoragePath: cloud_storage_path });
      setAddStep("result");
    } catch (err) {
      console.error(err);
      toast.error("Erro na análise");
      setAddStep("upload");
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: analysis.imageUrl,
          cloudStoragePath: analysis.cloudStoragePath,
          isPublic: false,
          category: analysis.category,
          color: analysis.color,
          pattern: analysis.pattern,
          style: analysis.style,
          aiAnalysis: analysis,
        }),
      });
      if (res.ok) {
        toast.success("Peça adicionada!");
        resetAdd();
        fetchItems();
      } else toast.error("Erro ao salvar");
    } catch { toast.error("Erro ao salvar"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta peça?")) return;
    try {
      await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
      setItems((prev: any[]) => (prev ?? []).filter((i: any) => i?.id !== id));
      toast.success("Peça removida");
    } catch { toast.error("Erro ao remover"); }
  };

  const resetAdd = () => {
    setShowAdd(false);
    setAddStep("upload");
    setPreviewUrl(null);
    setSelectedFile(null);
    setAnalysis(null);
  };

  const filtered = (items ?? []).filter((i: any) => {
    const matchFilter = filter === "Todas" || i?.category === filter;
    const matchSearch = !search || (i?.category ?? "").toLowerCase().includes(search.toLowerCase()) || (i?.color ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="px-5 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">Meu Guarda-roupa</h1>
          <p className="text-muted-foreground text-xs">{items?.length ?? 0} peças</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 rounded-xl">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar peças..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map((n: number) => (
            <div key={n} className="aspect-[3/4] rounded-xl bg-muted shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            {items.length === 0 ? "Adicione sua primeira peça!" : "Nenhuma peça encontrada"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item: any, idx: number) => (
            <motion.div
              key={item?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative group"
            >
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                <img
                  src={item?.imageUrl ?? ""}
                  alt={`${item?.category ?? "Peça"} ${item?.color ?? ""}`}
                  className="w-full h-full object-cover"
                  onError={(e: any) => { e.target.style.display = "none"; }}
                />
              </div>
              <div className="mt-1.5 px-0.5">
                <p className="text-xs font-medium truncate">{item?.category}</p>
                <p className="text-[10px] text-muted-foreground">{item?.color} · {item?.style ?? ""}</p>
              </div>
              <button
                onClick={() => handleDelete(item?.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">Adicionar peça</h2>
                <button onClick={resetAdd} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              {addStep === "upload" && (
                <>
                  <ImageUpload
                    onImageSelected={handleImageSelected}
                    preview={previewUrl}
                    onClear={() => { setPreviewUrl(null); setSelectedFile(null); }}
                    className="aspect-[3/4] mb-4"
                  />
                  {previewUrl && (
                    <Button onClick={handleAnalyze} className="w-full rounded-xl h-12">
                      <Sparkles className="w-4 h-4 mr-2" /> Analisar com IA
                    </Button>
                  )}
                </>
              )}

              {addStep === "analyzing" && <LoadingAnalysis message="Analisando sua peça..." />}

              {addStep === "result" && analysis && (
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                    <img src={previewUrl ?? ""} alt="Peça" className="w-full h-full object-cover" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["category", "color", "pattern", "style"].map((field: string) => (
                      <div key={field} className="bg-muted/50 rounded-xl p-3">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {field === "category" ? "Categoria" : field === "color" ? "Cor" : field === "pattern" ? "Padrão" : "Estilo"}
                        </label>
                        <Input
                          value={analysis?.[field] ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAnalysis((prev: any) => ({ ...(prev ?? {}), [field]: e.target.value }))
                          }
                          className="mt-1 h-9 text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetAdd} className="flex-1 rounded-xl h-11">Cancelar</Button>
                    <Button onClick={handleSave} loading={saving} className="flex-1 rounded-xl h-11">Salvar peça</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
