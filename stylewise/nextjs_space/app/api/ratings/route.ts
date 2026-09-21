export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { outfitId, liked } = await request.json();
    if (!outfitId || liked === undefined) {
      return NextResponse.json({ error: "outfitId e liked obrigatórios" }, { status: 400 });
    }

    const rating = await prisma.outfitRating.upsert({
      where: { userId_outfitId: { userId: session.user.id as string, outfitId } },
      create: { userId: session.user.id as string, outfitId, liked },
      update: { liked },
    });

    return NextResponse.json(rating);
  } catch (error: any) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
