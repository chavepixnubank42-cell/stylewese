export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl obrigatório" }, { status: 400 });
    }

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
            content: `Você é um especialista em moda. Analise a imagem de uma peça de roupa e identifique:
- category: a categoria da peça (Camisetas, Camisas, Blusas, Jaquetas, Casacos, Calças, Shorts, Saias, Vestidos, Tênis, Sapatos, Sandálias, Bolsas, Acessórios, Outros)
- color: a cor principal em português (Preto, Branco, Azul, Vermelho, Verde, Amarelo, Rosa, Roxo, Laranja, Marrom, Cinza, Bege, etc.)
- pattern: o padrão (Lisa, Listrada, Xadrez, Estampada, Floral, Poá, Geométrica, Outras)
- style: o estilo (Casual, Streetwear, Elegante, Esportivo, Minimalista, Boho, Clássico, Romântico)

Responda em JSON puro sem markdown:
{"category": "...", "color": "...", "pattern": "...", "style": "..."}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta peça de roupa:" },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI analyze error:", errText);
      return NextResponse.json({ error: "Erro na análise da IA" }, { status: 502 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let analysis;
    try { analysis = JSON.parse(content); } catch { analysis = {}; }

    return NextResponse.json({
      category: analysis?.category ?? "Outros",
      color: analysis?.color ?? "Indefinido",
      pattern: analysis?.pattern ?? "Lisa",
      style: analysis?.style ?? "Casual",
    });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Erro na análise" }, { status: 500 });
  }
}
