export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Lista curada de tendências de moda. Sem IA, sem serviço externo, sem custo.
 * Edite esta lista quando quiser atualizar o Radar: mude o "status", ajuste
 * os números de "scores" (0 a 100, 6 pontos = últimos 6 meses) ou adicione
 * novas tendências. Depois é só abrir /api/trends/generate de novo.
 *
 * status possíveis: "crescendo" | "consolidada" | "estavel" | "perdendo"
 * category deve ser uma das categorias do app (veja lib/types.ts)
 */
const CURATED_TRENDS = [
  {
    name: "Calça wide leg",
    category: "Calças",
    status: "crescendo",
    description: "Corte largo e fluido ganhando força sobre o skinny, especialmente em jeans e alfaiataria.",
    scores: [45, 52, 58, 66, 74, 82],
  },
  {
    name: "Vestido midi",
    category: "Vestidos",
    status: "consolidada",
    description: "Comprimento na altura da canela segue como escolha segura para trabalho e encontros.",
    scores: [70, 74, 76, 78, 80, 81],
  },
  {
    name: "Blazer oversized",
    category: "Casacos",
    status: "consolidada",
    description: "Ombros soltos e caimento largo continuam dominando looks de trabalho descontraído.",
    scores: [72, 75, 77, 78, 79, 80],
  },
  {
    name: "Jaqueta jeans",
    category: "Jaquetas",
    status: "estavel",
    description: "Peça curinga que se mantém popular ano a ano, sem grandes picos ou quedas.",
    scores: [60, 62, 59, 61, 60, 62],
  },
  {
    name: "Tênis branco minimalista",
    category: "Tênis",
    status: "consolidada",
    description: "Modelos limpos, sem muito detalhe, seguem como base de guarda-roupa versátil.",
    scores: [75, 76, 78, 79, 80, 82],
  },
  {
    name: "Sandália rasteira",
    category: "Sandálias",
    status: "crescendo",
    description: "Rasteirinhas voltam com força, puxadas por releituras de marcas de luxo e streetwear.",
    scores: [30, 38, 47, 55, 64, 71],
  },
  {
    name: "Bolsa transversal pequena",
    category: "Bolsas",
    status: "crescendo",
    description: "Formato compacto e prático ganha espaço sobre bolsas grandes no dia a dia.",
    scores: [40, 46, 53, 60, 67, 73],
  },
  {
    name: "Saia longa plissada",
    category: "Saias",
    status: "crescendo",
    description: "Plissados alongados aparecem cada vez mais em looks casuais e de trabalho.",
    scores: [35, 41, 48, 56, 63, 69],
  },
  {
    name: "Camiseta oversized",
    category: "Camisetas",
    status: "consolidada",
    description: "Caimento largo segue como padrão em básicos, do streetwear ao casual chique.",
    scores: [68, 70, 72, 73, 74, 75],
  },
  {
    name: "Casaco puffer",
    category: "Casacos",
    status: "perdendo",
    description: "Depois do pico do inverno, a procura por casacos acolchoados tende a cair na entressafra.",
    scores: [78, 74, 68, 60, 52, 44],
  },
  {
    name: "Calça cargo",
    category: "Calças",
    status: "perdendo",
    description: "Depois de anos em alta, o modelo com bolsos utilitários começa a perder espaço para cortes mais retos.",
    scores: [80, 76, 71, 65, 58, 51],
  },
  {
    name: "Colete alfaiataria",
    category: "Blusas",
    status: "estavel",
    description: "Coletes estruturados seguem como opção de camada, sem grande variação de interesse.",
    scores: [50, 52, 49, 51, 50, 52],
  },
] as const;

function buildEvolution(scores: readonly number[]) {
  const now = new Date();
  return scores.map((score, i) => {
    const d = new Date(now);
    d.setMonth(now.getMonth() - (scores.length - 1 - i));
    return { date: d.toISOString(), score: Math.max(0, Math.min(100, Math.round(score))) };
  });
}

export async function GET(request: NextRequest) {
  // Aceita usuário logado OU chamada automática (cron) com segredo
  const authHeader = request.headers.get("authorization");
  const isCron =
    !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  try {
    let created = 0;
    let updated = 0;

    for (const t of CURATED_TRENDS) {
      const values = {
        category: t.category,
        description: t.description,
        status: t.status,
        evolution: buildEvolution(t.scores),
        sources: ["Curadoria StyleWise"],
        lastUpdated: new Date(),
      };

      const existing = await prisma.trend.findFirst({ where: { name: t.name } });
      if (existing) {
        await prisma.trend.update({ where: { id: existing.id }, data: values });
        updated++;
      } else {
        await prisma.trend.create({ data: { name: t.name, ...values } });
        created++;
      }
    }

    // Remove tendências antigas (de tentativas anteriores com IA/Apify) que
    // não fazem mais parte da lista curada acima.
    const curatedNames = CURATED_TRENDS.map((t) => t.name);
    const removed = await prisma.trend.deleteMany({
      where: { name: { notIn: curatedNames } },
    });

    return NextResponse.json({
      ok: true,
      created,
      updated,
      removed: removed.count,
      total: CURATED_TRENDS.length,
    });
  } catch (error: any) {
    console.error("Trends seed error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
