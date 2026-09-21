export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const [trends, wardrobeItems, prefs] = await Promise.all([
      prisma.trend.findMany({ orderBy: { lastUpdated: "desc" } }),
      prisma.wardrobeItem.findMany({ where: { userId: session.user.id } }),
      prisma.userPreference.findFirst({ where: { userId: session.user.id } }),
    ]);

    const matches = (trends ?? []).map((trend: any) => {
      const related = (wardrobeItems ?? []).filter((item: any) => {
        const catMatch = (trend?.category ?? "").toLowerCase().includes((item?.category ?? "").toLowerCase().slice(0, 4));
        const styleMatch = (prefs?.styles ?? []).some((s: string) =>
          (trend?.name ?? "").toLowerCase().includes(s?.toLowerCase())
        );
        return catMatch || styleMatch;
      });

      return {
        trend,
        userItems: related,
        matchScore: related.length > 0 ? Math.min(1, related.length * 0.3) : 0,
        styleCompatibility: related.length > 0,
      };
    }).filter((m: any) => m.matchScore > 0)
      .sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error("Trend match error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
