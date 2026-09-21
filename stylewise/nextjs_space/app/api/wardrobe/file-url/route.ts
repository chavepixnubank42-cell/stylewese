export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFileUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { cloudStoragePath, contentType, isPublic } = await request.json();
    if (!cloudStoragePath) {
      return NextResponse.json({ error: "cloudStoragePath obrigatório" }, { status: 400 });
    }
    const url = await getFileUrl(cloudStoragePath, contentType ?? "image/jpeg", isPublic ?? false);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("File URL error:", error);
    return NextResponse.json({ error: "Erro ao gerar URL" }, { status: 500 });
  }
}
