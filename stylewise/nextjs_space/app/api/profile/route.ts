export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const [user, prefs, wardrobeCount, outfitCount, favCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.userPreference.findFirst({ where: { userId: session.user.id } }),
      prisma.wardrobeItem.count({ where: { userId: session.user.id } }),
      prisma.outfit.count({ where: { userId: session.user.id } }),
      prisma.favorite.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      user: { id: user?.id, email: user?.email, name: user?.name, avatar: user?.avatar },
      preferences: prefs,
      stats: { wardrobeCount, outfitCount, favCount },
    });
  } catch (error: any) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();

    if (body.name !== undefined || body.avatar !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.avatar !== undefined && { avatar: body.avatar }),
        },
      });
    }

    if (body.styles || body.favoriteColors || body.avoidColors || body.occasions || body.location !== undefined) {
      await prisma.userPreference.upsert({
        where: { userId: session.user.id as string },
        create: {
          userId: session.user.id as string,
          styles: body.styles ?? [],
          favoriteColors: body.favoriteColors ?? [],
          avoidColors: body.avoidColors ?? [],
          occasions: body.occasions ?? [],
          location: body.location ?? null,
        },
        update: {
          ...(body.styles && { styles: body.styles }),
          ...(body.favoriteColors && { favoriteColors: body.favoriteColors }),
          ...(body.avoidColors && { avoidColors: body.avoidColors }),
          ...(body.occasions && { occasions: body.occasions }),
          ...(body.location !== undefined && { location: body.location }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
