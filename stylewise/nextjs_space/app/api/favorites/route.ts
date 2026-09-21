export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        outfit: {
          include: { items: { include: { wardrobeItem: true }, orderBy: { order: "asc" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ favorites });
  } catch (error: any) {
    console.error("Favorites GET error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { outfitId } = await request.json();
    if (!outfitId) return NextResponse.json({ error: "outfitId obrigatório" }, { status: 400 });

    const existing = await prisma.favorite.findUnique({
      where: { userId_outfitId: { userId: session.user.id as string, outfitId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId: session.user.id as string, outfitId } });
    return NextResponse.json({ favorited: true }, { status: 201 });
  } catch (error: any) {
    console.error("Favorite toggle error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
