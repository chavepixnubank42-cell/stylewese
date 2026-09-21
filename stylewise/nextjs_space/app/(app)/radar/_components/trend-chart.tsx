"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface TrendChartProps {
  data: Array<{ date: string; score: number }>;
  color?: string;
}

export default function TrendChart({ data, color = "#C8A96B" }: TrendChartProps) {
  const chartData = (data ?? []).map((d: any) => ({
    date: d?.date ? new Date(d.date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" }) : "",
    score: d?.score ?? 0,
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9, fill: "#ffffff50" }}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "8px", fontSize: 11 }}
            labelStyle={{ color: "#F7F5F2" }}
            itemStyle={{ color }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.replace("#", "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
