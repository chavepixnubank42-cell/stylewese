"use client";
import { useState, useRef, useCallback } from "react";
import { Camera, Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  preview?: string | null;
  onClear?: () => void;
  className?: string;
  label?: string;
}

export function ImageUpload({ onImageSelected, preview, onClear, className, label }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File | undefined | null) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) return;
    onImageSelected(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer?.files?.[0]);
  }, [handleFile]);

  if (preview) {
    return (
      <div className={cn("relative rounded-2xl overflow-hidden", className)}>
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        {onClear && (
          <button
            onClick={onClear}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center gap-4 transition-colors",
        dragOver && "border-[#C8A96B] bg-[#C8A96B]/5",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Upload className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {label ?? "Arraste uma foto ou selecione abaixo"}
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          className="gap-2"
        >
          <Camera className="w-4 h-4" /> Câmera
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <ImageIcon className="w-4 h-4" /> Galeria
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target?.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target?.files?.[0])}
      />
    </div>
  );
}
