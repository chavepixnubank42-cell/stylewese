export const dynamic = "force-dynamic";
export const maxDuration = 300; // se o build da Vercel reclamar deste valor, troque por 60
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const SOURCE = "Google Trends (via Apify)";
const MIN_HOURS_BETWEEN_RUNS = 24;

// Termos de moda acompanhados no Google Trends (Brasil). Edite à vontade.
// term = o que é pesquisado no Google | name = como aparece no Radar
// category precisa ser uma das categorias do app (lib/types.ts)
const TERMS = [
  { term: "calça cargo", name: "Calça cargo", category: "Calças" },
  { term: "calça wide leg", name: "Calça wide leg", category: "Calças" },
  { term: "vestido midi", name: "Vestido midi", category: "Vestidos" },
  { term: "saia longa", name: "Saia longa", category: "Saias" },
  { term: "camiseta oversized", name: "Camiseta oversized", category: "Camisetas" },
  { term: "blazer oversized", name: "Blazer oversized", category: "Casacos" },
  { term: "jaqueta jeans", name: "Jaqueta jeans", category: "Jaquetas" },
  { term: "tênis branco", name: "Tênis branco", category: "Tênis" },
  { term: "sandália rasteira", name: "Sandália rasteira", category: "Sandálias" },
  { term: "bolsa transversal", name: "Bolsa transversal", category: "Bolsas" },
];

type Pt = { t: number; v: number };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Lê a resposta do Apify aceitando os formatos mais comuns de "interesse ao longo do tempo"
function collectSeries(items: any[]): Map<string, Pt[]> {
  const map = new Map<string, Pt[]>();

  const add = (term: any, t: number, v: any) => {
    const key = typeof term === "string" ? norm(term) : "";
    const val = Number(Array.isArray(v) ? v[0] : v);
    if (!key || !Number.isFinite(t) || !Number.isFinite(val)) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ t, v: val });
  };

  for (const item of items ?? []) {
    const term = item?.searchTerm ?? item?.inputUrlOrTerm ?? item?.keyword ?? item?.term;

    if (Array.isArray(item?.interestOverTime_timelineData)) {
      for (const p of item.interestOverTime_timelineData) {
        add(term, Number(p?.time) * 1000, p?.value);
      }
    } else if (Array.isArray(item?.interestOverTime)) {
      for (const p of item.interestOverTime) {
        add(term, p?.time ? Number(p.time) * 1000 : Date.parse(p?.date), p?.value);
      }
    } else if (item?.value !== undefined && (item?.time || item?.date)) {
      add(term, item.time ? Number(item.time) * 1000 : Date.parse(item.date), item.value);
    }
  }

  for (const pts of map.values()) pts.sort((a, b) => a.t - b.t);
  return map;
}

// Reduz a série (ex.: 52 semanas) para no máximo 12 pontos, tirando a média de cada bloco
function downsample(pts: Pt[], n = 12): Pt[] {
  if (pts.length <= n) return pts;
  const size = pts.length / n;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const slice = pts.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    if (slice.length === 0) continue;
    const avg = slice.reduce((s, p) => s + p.v, 0) / slice.length;
    out.push({ t: slice[slice.length - 1].t, v: avg });
  }
  return out;
}

// Compara os 3 últimos pontos com os 3 anteriores
function computeStatus(pts: Pt[]): string {
  if (pts.length < 6) return "estavel";
  const avg = (a: Pt[]) => a.reduce((s, p) => s + p.v, 0) / a.length;
  const recent = avg(pts.slice(-3));
  const before = avg(pts.slice(-6, -3));
  const change = before > 0 ? (recent - before) / before : recent > 0 ? 1 : 0;
  if (change >= 0.15) return "crescendo";
  if (change <= -0.15) return "perdendo";
  if (recent >= 60) return "consolidada";
  return "estavel";
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

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "APIFY_TOKEN não está configurado na Vercel" },
      { status: 500 }
    );
  }

  try {
    // Evita gastar créditos do Apify à toa: só busca de novo depois de 24h
    const latest = await prisma.trend.findFirst({
      where: { sources: { has: SOURCE } },
      orderBy: { lastUpdated: "desc" },
    });
    if (latest) {
      const hours = (Date.now() - latest.lastUpdated.getTime()) / 3600000;
      if (hours < MIN_HOURS_BETWEEN_RUNS) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          message: `Tendências atualizadas há ${Math.round(hours)}h. Nova busca só depois de ${MIN_HOURS_BETWEEN_RUNS}h.`,
        });
      }
    }

    const response = await fetch(
      "https://api.apify.com/v2/acts/apify~google-trends-scraper/run-sync-get-dataset-items",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          searchTerms: TERMS.map((t) => t.term),
          geo: "BR",
          timeRange: "today 12-m",
          isMultiple: false,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Trends Apify error:", response.status, errText);
      return NextResponse.json(
        { error: "Erro ao consultar o Apify", status: response.status },
        { status: 502 }
      );
    }

    const raw = await response.json();
    const items: any[] = Array.isArray(raw) ? raw : [];
    const series = collectSeries(items);

    let saved = 0;
    const missing: string[] = [];

    for (const t of TERMS) {
      const pts = series.get(norm(t.term));
      if (!pts || pts.length < 2) {
        missing.push(t.term);
        continue;
      }

      const ds = downsample(pts);
      const values = {
        category: t.category,
        description: `Interesse de busca no Google Brasil por "${t.term}" nos últimos 12 meses.`,
        status: computeStatus(ds),
        evolution: ds.map((p) => ({
          date: new Date(p.t).toISOString(),
          score: Math.max(0, Math.min(100, Math.round(p.v))),
        })),
        sources: [SOURCE],
        lastUpdated: new Date(),
      };

      const existing = await prisma.trend.findFirst({ where: { name: t.name } });
      if (existing) {
        await prisma.trend.update({ where: { id: existing.id }, data: values });
      } else {
        await prisma.trend.create({ data: { name: t.name, ...values } });
      }
      saved++;
    }

    if (saved === 0) {
      // Ajuda a descobrir se o formato da resposta do Apify mudou
      return NextResponse.json(
        {
          error: "Nenhum dado utilizável veio do Apify",
          itemsReceived: items.length,
          sampleKeys: Object.keys(items[0] ?? {}),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, saved, missing });
  } catch (error: any) {
    console.error("Trends generate error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
