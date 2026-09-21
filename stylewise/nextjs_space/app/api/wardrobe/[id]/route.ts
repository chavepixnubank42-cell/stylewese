export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const item = await prisma.wardrobeItem.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!item) return NextResponse.json({ error: "Peça não encontrada" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Wardrobe item GET error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();
    const item = await prisma.wardrobeItem.updateMany({
      where: { id, userId: session.user.id },
      data: {
        ...(body.category !== undefined && { category: body.category }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.pattern !== undefined && { pattern: body.pattern }),
        ...(body.style !== undefined && { style: body.style }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.season !== undefined && { season: body.season }),
      },
    });
    return NextResponse.json({ updated: item.count });
  } catch (error: any) {
    console.error("Wardrobe item PATCH error:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const item = await prisma.wardrobeItem.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!item) return NextResponse.json({ error: "Peça não encontrada" }, { status: 404 });

    if (item.cloudStoragePath) {
      try { await deleteFile(item.cloudStoragePath); } catch {}
    }

    await prisma.wardrobeItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Wardrobe item DELETE error:", error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
