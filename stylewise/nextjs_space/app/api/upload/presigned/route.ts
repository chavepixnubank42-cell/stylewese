export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generatePresignedUploadUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { fileName, contentType, isPublic } = await request.json();
    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName e contentType obrigatórios" }, { status: 400 });
    }
    const result = await generatePresignedUploadUrl(fileName, contentType, isPublic ?? false);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: "Erro ao gerar URL" }, { status: 500 });
  }
}
