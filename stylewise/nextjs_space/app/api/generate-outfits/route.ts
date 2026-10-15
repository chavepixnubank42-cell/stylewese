export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY não configurada");
    return new Response(JSON.stringify({ error: "Chave GROQ_API_KEY não configurada no servidor" }), { status: 500 });
  }

  try {
    const { baseItemId, occasion, style, weather, mode } = await request.json();

    const items = await prisma.wardrobeItem.findMany({
      where: { userId: session.user.id },
    });

    if ((items?.length ?? 0) < 2) {
      return new Response(JSON.stringify({ error: "Adicione mais peças ao guarda-roupa para gerar combinações" }), { status: 400 });
    }

    const ratings = await prisma.outfitRating.findMany({
      where: { userId: session.user.id },
      include: { outfit: { include: { items: { include: { wardrobeItem: true } } } } },
    });

    const likedStyles = (ratings ?? []).filter((r: any) => r?.liked).map((r: any) => r?.outfit?.style).filter(Boolean);
    const likedColors = (ratings ?? []).filter((r: any) => r?.liked).flatMap((r: any) =>
      (r?.outfit?.items ?? []).map((i: any) => i?.wardrobeItem?.color)
    ).filter(Boolean);

    const baseItem = baseItemId ? items?.find((i: any) => i?.id === baseItemId) : null;

    const wardrobeSummary = (items ?? []).map((i: any) => `- ${i?.category}: ${i?.color} ${i?.pattern ?? ""} ${i?.style ?? ""} (id: ${i?.id})`).join("\n");

    let prompt = "";
    if (mode === "occasion") {
      prompt = `Com base no guarda-roupa abaixo, gere 3 a 5 looks adequados para a ocasião: "${occasion ?? "casual"}".

Guarda-roupa disponível:
${wardrobeSummary}

Clima: ${weather ? JSON.stringify(weather) : "Não especificado"}
Estilo preferido: ${style ?? "Variado"}
${likedStyles.length > 0 ? `Estilos que o usuário gosta: ${[...new Set(likedStyles)].join(", ")}` : ""}
${likedColors.length > 0 ? `Cores que o usuário gosta: ${[...new Set(likedColors)].join(", ")}` : ""}

Para cada look, use APENAS os IDs das peças listadas acima.
Responda em JSON:
{"outfits":[{"name":"Nome do look","itemIds":["id1","id2","id3"],"explanation":"Explicação detalhada de por que este look funciona para a ocasião","occasion":"...","style":"..."}]}`;
    } else {
      prompt = `Com base no guarda-roupa abaixo, gere 3 a 5 looks usando a peça base: ${baseItem ? `${baseItem.category} ${baseItem.color} (id: ${baseItem.id})` : "qualquer peça"}.

Guarda-roupa disponível:
${wardrobeSummary}

Ocasião: ${occasion ?? "Casual"}
Estilo: ${style ?? "Variado"}
Clima: ${weather ? JSON.stringify(weather) : "Não especificado"}
${likedStyles.length > 0 ? `Estilos que o usuário gosta: ${[...new Set(likedStyles)].join(", ")}` : ""}
${likedColors.length > 0 ? `Cores que o usuário gosta: ${[...new Set(likedColors)].join(", ")}` : ""}

Para cada look, use APENAS os IDs das peças listadas acima. Inclua a peça base em todos os looks.
Responda em JSON:
{"outfits":[{"name":"Nome do look","itemIds":["id1","id2","id3"],"explanation":"Explicação detalhada de por que esta combinação funciona","occasion":"...","style":"..."}]}`;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Você é um personal stylist premium com IA. Crie combinações de looks usando APENAS as peças do guarda-roupa do usuário. Cada look deve ter 2-4 peças. Forneça explicações detalhadas e personalizadas.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("Generate outfits error:", await response.text());
      return new Response(JSON.stringify({ error: "Erro ao gerar looks" }), { status: 502 });
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";
    let partialRead = "";

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        const finalize = async () => {
          let aiResult: any;
          try { aiResult = JSON.parse(buffer); } catch {
            console.error("JSON inválido da IA:", buffer.slice(0, 500));
            aiResult = { outfits: [] };
          }

          const savedOutfits = [];
          for (const outfit of (aiResult?.outfits ?? [])) {
            const validIds = Array.from(new Set<string>(
              (outfit?.itemIds ?? []).filter((id: string) => items?.some((i: any) => i?.id === id))
            ));
            if (validIds.length < 1) continue;

            const saved = await prisma.outfit.create({
              data: {
                userId: session.user?.id as string,
                name: outfit?.name ?? "Look sugerido",
                occasion: outfit?.occasion ?? occasion ?? null,
                style: outfit?.style ?? style ?? null,
                explanation: outfit?.explanation ?? null,
                // Json? no Prisma não aceita `null` direto: usar undefined
                weather: weather ?? undefined,
                items: {
                  create: validIds.map((id: string, idx: number) => ({
                    wardrobeItemId: id,
                    order: idx + 1,
                  })),
                },
              },
              include: { items: { include: { wardrobeItem: true }, orderBy: { order: "asc" } } },
            });
            savedOutfits.push(saved);
          }

          if (savedOutfits.length === 0) {
            send({ status: "error", message: "A IA não conseguiu montar looks. Tente novamente." });
            return;
          }

          await prisma.history.create({
            data: {
              userId: session.user?.id as string,
              type: mode === "occasion" ? "occasion_outfits" : "outfit_generated",
              data: { count: savedOutfits.length, occasion: occasion ?? null, style: style ?? null },
            },
          }).catch(() => {});

          send({ status: "completed", result: { outfits: savedOutfits } });
        };

        try {
          if (!reader) { send({ status: "error", message: "Sem resposta da IA" }); controller.close(); return; }
          let finished = false;
          while (!finished) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split("\n");
            partialRead = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const d = line.slice(6).trim();
              if (d === "[DONE]") { finished = true; break; }
              try {
                const parsed = JSON.parse(d);
                buffer += parsed?.choices?.[0]?.delta?.content ?? "";
                send({ status: "processing", message: "Criando combinações..." });
              } catch {}
            }
          }
          // Finaliza mesmo se o stream fechar sem [DONE]
          await finalize();
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          try { send({ status: "error", message: "Erro ao gerar looks" }); } catch {}
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (error: any) {
    console.error("Generate outfits error:", error);
    return new Response(JSON.stringify({ error: "Erro" }), { status: 500 });
  }
}
