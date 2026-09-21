"use client";
import { TREND_STATUSES } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TrendBadge({ status, className }: { status: string; className?: string }) {
  const info = (TREND_STATUSES as any)?.[status] ?? { label: status, emoji: "", color: "#999" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
        className
      )}
      style={{ backgroundColor: `${info.color}15`, color: info.color }}
    >
      {info.emoji} {info.label}
    </span>
  );
}
