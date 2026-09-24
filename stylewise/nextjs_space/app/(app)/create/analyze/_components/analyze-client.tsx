"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { LoadingAnalysis } from "@/components/loading-analysis";
import { ScoreBar } from "@/components/score-bar";
import { toast } from "sonner";
import Link from "next/link";
import type { LookAnalysis } from "@/lib/types";
import { upload } from "@vercel/blob/client";

export function AnalyzeClient() {
  const [step, setStep] = useState<"upload" | "analyzing" | "result">("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<LookAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!file) return;
    setStep("analyzing");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      const imageUrl = blob.url;

      const response = await fetch("/api/analyze-look", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = "";

      if (!reader) { setStep("upload"); toast.error("Erro"); return; }
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
                setResult(parsed?.result ?? null);
                setStep("result");
                return;
              } else if (parsed?.status === "error") {
                throw new Error(parsed?.message);
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro na análise");
      setStep("upload");
    }
  };

  const reset = () => {
    setStep("upload");
    setPreviewUrl(null);
    setFile(null);
    setResult(null);
  };

  return (
    <div className="px-5 pt-8 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/home" className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="font-display text-xl font-bold">Analisar meu look</h1>
          <p className="text-muted-foreground text-xs">Tire uma foto e descubra o potencial</p>
        </div>
      </div>

      {step === "upload" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ImageUpload
            onImageSelected={(f: File) => { setFile(f); setPreviewUrl(URL.createObjectURL(f)); }}
            preview={previewUrl}
            onClear={() => { setPreviewUrl(null); setFile(null); }}
            className="aspect-[3/4] mb-4"
            label="Tire uma foto do seu look completo"
          />
          {previewUrl && (
            <Button onClick={handleAnalyze} className="w-full rounded-xl h-12 gap-2">
              <Camera className="w-4 h-4" /> Analisar look
            </Button>
          )}
        </motion.div>
      )}

      {step === "analyzing" && <LoadingAnalysis message="Analisando seu look..." />}

      {step === "result" && result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
            <img src={previewUrl ?? ""} alt="Look" className="w-full h-full object-cover" />
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-bold">Análise da IA</h3>
            <ScoreBar label="Combinação" score={result?.scores?.combination ?? 0} />
            <ScoreBar label="Cores" score={result?.scores?.colors ?? 0} />
            <ScoreBar label="Estilo" score={result?.scores?.style ?? 0} />
          </div>

          {(result?.whatWorks?.length ?? 0) > 0 && (
            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="text-green-600">✓</span> O que funciona
              </h3>
              <ul className="space-y-2">
                {(result?.whatWorks ?? []).map((w: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(result?.improvements?.length ?? 0) > 0 && (
            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="text-amber-500">⚡</span> O que pode melhorar
              </h3>
              <ul className="space-y-2">
                {(result?.improvements ?? []).map((m: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.suggestion && (
            <div className="bg-[#C8A96B]/10 rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>💡</span> Sugestão da IA
              </h3>
              <p className="text-sm text-foreground">{result.suggestion}</p>
            </div>
          )}

          <Button onClick={reset} variant="outline" className="w-full rounded-xl h-11">
            Nova análise
          </Button>
        </motion.div>
      )}
    </div>
  );
}
