import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const teachers = await prisma.teacher.findMany({
    include: { classes: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ teachers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  if (!name || !subject) {
    return NextResponse.json({ error: "name and subject are required" }, { status: 400 });
  }
  const teacher = await prisma.teacher.create({ data: { name, subject } });
  return NextResponse.json({ teacher }, { status: 201 });
}
