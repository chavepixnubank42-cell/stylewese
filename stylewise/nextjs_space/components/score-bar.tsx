"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  className?: string;
}

export function ScoreBar({ label, score, maxScore = 10, className }: ScoreBarProps) {
  const [width, setWidth] = useState(0);
  const pct = Math.min(100, (score / maxScore) * 100);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{score}/{maxScore}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full champagne-gradient transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
