import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId");
  const deadlines = await prisma.deadline.findMany({
    where: classId ? { classId } : undefined,
    include: { class: { include: { teacher: true } } },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }],
  });
  return NextResponse.json({ deadlines });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const deadline = await prisma.deadline.update({
    where: { id },
    data: { done: Boolean(body.done) },
  });
  return NextResponse.json({ deadline });
}
