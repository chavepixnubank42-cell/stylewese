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

// Duas categorias são "a mesma" se uma contém a outra, ou se as 5 primeiras
// letras batem (cobre plural/singular: "calça" vs "calças").
function categoriesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return a.slice(0, 5) === b.slice(0, 5);
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

    const matches = (trends ?? [])
      .map((trend: any) => {
        const trendCategory = normalize(trend?.category);
        const trendName = normalize(trend?.name);

        // Só entram peças cuja categoria bate com a categoria da tendência.
        // Esse é o critério que decide QUAIS peças aparecem.
        const related = (wardrobeItems ?? []).filter((item: any) =>
          categoriesMatch(trendCategory, normalize(item?.category))
        );

        // Estilo só serve para o selo "Combina com seu estilo", não decide
        // quais peças são mostradas.
        const styleCompatibility = userStyles.some((s: string) => trendName.includes(s));

        return {
          trend,
          userItems: related,
          matchScore: related.length > 0 ? Math.min(1, related.length * 0.3 + (styleCompatibility ? 0.1 : 0)) : 0,
          styleCompatibility,
        };
      })
      .filter((m: any) => m.userItems.length > 0)
      .sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error("Trend match error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
