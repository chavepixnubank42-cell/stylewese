export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: any = {};
    if (category && category !== "Todas") where.category = category;
    if (status && status !== "todas") where.status = status;

    const trends = await prisma.trend.findMany({
      where,
      orderBy: { lastUpdated: "desc" },
    });

    return NextResponse.json({ trends });
  } catch (error: any) {
    console.error("Trends GET error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
