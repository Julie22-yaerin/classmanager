import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: true,
      materials: { orderBy: { createdAt: "desc" } },
      deadlines: { orderBy: { dueDate: "asc" } },
      examReports: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
  return NextResponse.json({ class: cls });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.class.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
