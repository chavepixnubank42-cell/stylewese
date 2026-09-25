export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function normalize(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function categoriesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return a.slice(0, 5) === b.slice(0, 5);
}

// Quanto essa peça "bate" com essa tendência específica (não só a categoria)
function scoreItemForTrend(item: any, trend: any, userStyles: string[]): number {
  const trendName = normalize(trend?.name);
  const trendDesc = normalize(trend?.description);
  const itemStyle = normalize(item?.style);
  const itemPattern = normalize(item?.pattern);
  const itemColor = normalize(item?.color);

  let score = 1; // base: categoria já bateu

  if (itemStyle && (trendName.includes(itemStyle) || itemStyle.includes(trendName))) score += 3;
  if (itemPattern && trendName.includes(itemPattern)) score += 2;
  if (itemStyle && trendDesc.includes(itemStyle)) score += 1;
  if (itemColor && trendDesc.includes(itemColor)) score += 0.5;
  if (userStyles.some((s) => trendName.includes(s))) score += 0.5;

  return score;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const [trends, wardrobeItems, prefs] = await Promise.all([
      prisma.trend.findMany({ orderBy: { lastUpdated: "desc" } }),
      prisma.wardrobeItem.findMany({ where: { userId: session.user.id } }),
      prisma.userPreference.findFirst({ where: { userId: session.user.id } }),
    ]);

    const userStyles = (prefs?.styles ?? []).map((s: string) => normalize(s));

    // Para cada peça, acha todas as tendências de categoria compatível
    // e escolhe SÓ a de maior pontuação — evita a mesma peça aparecer
    // em duas tendências da mesma categoria (ex: duas tendências de calça).
    const assignedByTrendId = new Map<string, any[]>();

    for (const item of wardrobeItems ?? []) {
      const itemCategory = normalize(item?.category);
      const candidates = (trends ?? [])
        .filter((trend: any) => categoriesMatch(normalize(trend?.category), itemCategory))
        .map((trend: any) => ({ trend, score: scoreItemForTrend(item, trend, userStyles) }));

      if (candidates.length === 0) continue;

      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.trend.lastUpdated).getTime() - new Date(a.trend.lastUpdated).getTime();
      });

      const winner = candidates[0].trend;
      if (!assignedByTrendId.has(winner.id)) assignedByTrendId.set(winner.id, []);
      assignedByTrendId.get(winner.id)!.push(item);
    }

    const trendName = (t: any) => normalize(t?.name);
    const matches = (trends ?? [])
      .filter((trend: any) => assignedByTrendId.has(trend.id))
      .map((trend: any) => {
        const related = assignedByTrendId.get(trend.id)!;
        const styleCompatibility = userStyles.some((s) => trendName(trend).includes(s));
        return {
          trend,
          userItems: related,
          matchScore: Math.min(1, related.length * 0.3 + (styleCompatibility ? 0.1 : 0)),
          styleCompatibility,
        };
      })
      .sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error("Trend match error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
