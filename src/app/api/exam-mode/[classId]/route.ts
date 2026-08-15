import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateExamReport } from "@/lib/examMode";
import { MissingApiKeyError } from "@/lib/ai";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  try {
    const report = await generateExamReport(classId);
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 401 });
    }
    console.error("exam report generation failed", err);
    return NextResponse.json({ error: "Failed to generate exam report" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const reports = await prisma.examReport.findMany({
    where: { classId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ reports });
}
