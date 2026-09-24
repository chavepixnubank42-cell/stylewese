export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const STATUSES = ["crescendo", "consolidada", "estavel", "perdendo"];
const CATEGORIES = [
  "Camisetas", "Camisas", "Blusas", "Jaquetas", "Casacos", "Calças",
  "Shorts", "Saias", "Vestidos", "Tênis", "Sapatos", "Sandálias",
  "Bolsas", "Acessórios", "Outros",
];
const POINTS = 6; // quantidade de meses no gráfico
const MIN_HOURS_BETWEEN_RUNS = 24;

function clampScore(n: any): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

// Monta [{date, score}] com uma data por mês, do mais antigo ao mais recente
function buildEvolution(scores: any[]) {
  const now = new Date();
  const list = Array.isArray(scores) ? scores.slice(-POINTS) : [];
  while (list.length < POINTS) list.unshift(list[0] ?? 50);
  return list.map((s: any, i: number) => {
    const d = new Date(now);
    d.setMonth(now.getMonth() - (POINTS - 1 - i));
    return { date: d.toISOString(), score: clampScore(s) };
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
    // Evita gastar créditos de IA à toa: só gera de novo depois de 24h
    const latest = await prisma.trend.findFirst({ orderBy: { lastUpdated: "desc" } });
    if (latest) {
      const hours = (Date.now() - latest.lastUpdated.getTime()) / 3600000;
      if (hours < MIN_HOURS_BETWEEN_RUNS) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          message: `Tendências atualizadas há ${Math.round(hours)}h. Nova geração só depois de ${MIN_HOURS_BETWEEN_RUNS}h.`,
        });
      }
    }

    const hoje = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        messages: [
          {
            role: "system",
            content: `Você é uma analista de tendências de moda para o mercado brasileiro. Hoje é ${hoje}.
Liste 8 tendências de moda atuais e relevantes, variando os status.

Regras:
- "category" deve ser EXATAMENTE uma destas: ${CATEGORIES.join(", ")}.
- "status" deve ser EXATAMENTE um destes: ${STATUSES.join(", ")}.
- "description": 1 ou 2 frases em português do Brasil.
- "scores": exatamente ${POINTS} números inteiros de 0 a 100 (popularidade), do mês mais antigo ao mais recente, coerentes com o status (crescendo = sobe, perdendo = desce, estavel = quase reto, consolidada = alta e firme).

Responda somente em JSON puro:
{"trends":[{"name":"...","category":"...","description":"...","status":"...","scores":[40,45,52,60,68,75]}]}`,
          },
          { role: "user", content: "Gere as tendências agora." },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Trends generate AI error:", errText);
      return NextResponse.json({ error: "Erro ao consultar a IA" }, { status: 502 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Trends generate: JSON inválido da IA:", content);
      return NextResponse.json({ error: "Resposta da IA inválida" }, { status: 502 });
    }

    const list: any[] = Array.isArray(parsed?.trends) ? parsed.trends : [];
    let saved = 0;

    for (const t of list) {
      const name = typeof t?.name === "string" ? t.name.trim() : "";
      if (!name) continue;

      const values = {
        category: CATEGORIES.includes(t?.category) ? t.category : "Outros",
        description: typeof t?.description === "string" ? t.description : null,
        status: STATUSES.includes(t?.status) ? t.status : "estavel",
        evolution: buildEvolution(t?.scores),
        sources: ["Gerado por IA"],
        lastUpdated: new Date(),
      };

      const existing = await prisma.trend.findFirst({ where: { name } });
      if (existing) {
        await prisma.trend.update({ where: { id: existing.id }, data: values });
      } else {
        await prisma.trend.create({ data: { name, ...values } });
      }
      saved++;
    }

    return NextResponse.json({ ok: true, saved });
  } catch (error: any) {
    console.error("Trends generate error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
