export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const MODEL = "qwen/qwen3.8-27b";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl obrigatório" }), { status: 400 });
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
            content: `Você é um consultor de moda premium. Analise o look completo na imagem e forneça:
1. Scores de 0 a 10 para: combinação (combination), cores (colors), estilo (style)
2. Lista de pontos positivos (whatWorks) - 3 a 5 itens
3. Lista de melhorias (improvements) - 1 a 3 itens
4. Uma sugestão única e personalizada (suggestion)
5. Peças detectadas (detectedItems) com category e color

Seja específico e útil. Responda em JSON puro:
{"scores":{"combination":8,"colors":9,"style":7},"whatWorks":["..."],"improvements":["..."],"suggestion":"...","detectedItems":[{"category":"...","color":"..."}]}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise este look completo:" },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq look analyze error:", errText);
      return new Response(JSON.stringify({ error: "Erro na análise da IA" }), { status: 502 });
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";
    let partialRead = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!reader) { controller.close(); return; }
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split("\n");
            partialRead = lines.pop() ?? "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const d = line.slice(6);
                if (d === "[DONE]") {
                  let result;
                  try { result = JSON.parse(buffer); } catch { result = {}; }
                  const finalData = JSON.stringify({ status: "completed", result });
                  controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

                  await prisma.history.create({
                    data: {
                      userId: session.user?.id as string,
                      type: "look_analyzed",
                      data: { imageUrl, scores: result?.scores },
                    },
                  }).catch(() => {});

                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(d);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? "";
                  const progress = JSON.stringify({ status: "processing", message: "Analisando seu look..." });
                  controller.enqueue(encoder.encode(`data: ${progress}\n\n`));
                } catch {}
              }
            }
          }
          if (buffer) {
            let result;
            try { result = JSON.parse(buffer); } catch { result = {}; }
            const finalData = JSON.stringify({ status: "completed", result });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          const errData = JSON.stringify({ status: "error", message: "Erro na análise" });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Analyze look error:", error);
    return new Response(JSON.stringify({ error: "Erro" }), { status: 500 });
  }
}
