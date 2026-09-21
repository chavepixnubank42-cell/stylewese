"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { TrendBadge } from "@/components/trend-badge";
import { TREND_STATUSES } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";

const TrendChart = dynamic(() => import("./trend-chart"), { ssr: false, loading: () => <div className="h-32 shimmer rounded-xl" /> });

const STATUS_FILTERS = ["todas", "crescendo", "consolidada", "estavel", "perdendo"];

export function RadarClient() {
  const [trends, setTrends] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [tab, setTab] = useState<"trends" | "matches">("trends");

  useEffect(() => {
    Promise.all([
      fetch(`/api/trends${statusFilter !== "todas" ? `?status=${statusFilter}` : ""}`).then((r) => r.json()),
      fetch("/api/trends/match").then((r) => r.json()),
    ]).then(([tData, mData]) => {
      setTrends(tData?.trends ?? []);
      setMatches(mData?.matches ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="dark-section min-h-screen -mx-0 px-5 pt-8 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-6 h-6 text-[#FF6B6B]" />
          <h1 className="font-display text-xl font-bold text-[#F7F5F2]">Radar de Moda</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("trends")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
              tab === "trends" ? "bg-[#C8A96B] text-white" : "bg-white/10 text-[#F7F5F2]/70"
            )}
          >Tendências</button>
          <button
            onClick={() => setTab("matches")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
              tab === "matches" ? "bg-[#C8A96B] text-white" : "bg-white/10 text-[#F7F5F2]/70"
            )}
          >✨ Combina comigo?</button>
        </div>

        {tab === "trends" && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              {STATUS_FILTERS.map((s: string) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                    statusFilter === s ? "bg-white/20 text-[#F7F5F2]" : "bg-white/5 text-[#F7F5F2]/50"
                  )}
                >
                  {s === "todas" ? "Todas" : (TREND_STATUSES as any)?.[s]?.emoji ?? ""} {s === "todas" ? "" : (TREND_STATUSES as any)?.[s]?.label ?? s}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((n: number) => <div key={n} className="h-40 rounded-2xl bg-white/5 shimmer" />)}
              </div>
            ) : trends.length === 0 ? (
              <p className="text-[#F7F5F2]/50 text-sm text-center py-12">Nenhuma tendência encontrada</p>
            ) : (
              <div className="space-y-3">
                {trends.map((trend: any, idx: number) => (
                  <motion.div
                    key={trend?.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A] hover:border-[#C8A96B]/30 transition-all cursor-pointer"
                    onClick={() => setShowDetail(trend)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#F7F5F2] text-sm">{trend?.name}</h3>
                        <p className="text-[#F7F5F2]/40 text-xs mt-0.5">{trend?.category}</p>
                      </div>
                      <TrendBadge status={trend?.status ?? "estavel"} />
                    </div>
                    {trend?.description && (
                      <p className="text-[#F7F5F2]/60 text-xs mb-3 line-clamp-2">{trend.description}</p>
                    )}
                    <TrendChart data={trend?.evolution ?? []} color={(TREND_STATUSES as any)?.[trend?.status]?.color ?? "#C8A96B"} />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[#F7F5F2]/30 text-[10px]">Fontes: {(trend?.sources ?? []).join(", ")}</span>
                      <ChevronRight className="w-4 h-4 text-[#F7F5F2]/30" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "matches" && (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">{[1,2].map((n: number) => <div key={n} className="h-32 rounded-2xl bg-white/5 shimmer" />)}</div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-10 h-10 mx-auto text-[#C8A96B]/50 mb-3" />
                <p className="text-[#F7F5F2]/50 text-sm">Adicione peças ao guarda-roupa para ver correspondências</p>
              </div>
            ) : (
              matches.map((match: any, idx: number) => (
                <motion.div
                  key={match?.trend?.id ?? idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#F7F5F2] text-sm">{match?.trend?.name}</h3>
                    <TrendBadge status={match?.trend?.status ?? "estavel"} />
                  </div>
                  <div className="flex gap-2 mb-3">
                    {(match?.userItems ?? []).slice(0, 4).map((item: any) => (
                      <div key={item?.id} className="w-12 h-14 rounded-lg overflow-hidden bg-white/5">
                        <img src={item?.imageUrl ?? ""} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] text-green-400">✓ Você possui {match?.userItems?.length ?? 0} peça(s)</span>
                    {match?.styleCompatibility && (
                      <span className="text-[10px] text-green-400">✓ Combina com seu estilo</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
