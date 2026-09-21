export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const items = await prisma.wardrobeItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Wardrobe GET error:", error);
    return NextResponse.json({ error: "Erro ao buscar peças" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const item = await prisma.wardrobeItem.create({
      data: {
        userId: session.user.id as string,
        imageUrl: body.imageUrl,
        cloudStoragePath: body.cloudStoragePath ?? null,
        isPublic: body.isPublic ?? false,
        category: body.category,
        color: body.color,
        pattern: body.pattern ?? null,
        style: body.style ?? null,
        brand: body.brand ?? null,
        season: body.season ?? null,
        aiAnalysis: body.aiAnalysis ?? null,
      },
    });

    await prisma.history.create({
      data: {
        userId: session.user.id as string,
        type: "item_added",
        data: { itemId: item.id, category: item.category },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Wardrobe POST error:", error);
    return NextResponse.json({ error: "Erro ao adicionar peça" }, { status: 500 });
  }
}
