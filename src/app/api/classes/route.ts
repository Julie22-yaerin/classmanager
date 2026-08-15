import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const classes = await prisma.class.findMany({
    include: { teacher: true, _count: { select: { materials: true, deadlines: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ classes });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
  const grade = typeof body.grade === "string" ? body.grade.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const textbook = typeof body.textbook === "string" ? body.textbook.trim() : null;

  if (!teacherId || !grade || !subject) {
    return NextResponse.json({ error: "teacherId, grade, and subject are required" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    return NextResponse.json({ error: "Unknown teacher" }, { status: 404 });
  }

  const cls = await prisma.class.create({
    data: { teacherId, grade, subject, textbook: textbook || null },
    include: { teacher: true },
  });
  return NextResponse.json({ class: cls }, { status: 201 });
}
