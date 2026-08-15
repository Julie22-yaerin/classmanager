import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const profile = await prisma.studentProfile.findFirst();
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const fields = ["academicLevel", "explanationStyle", "communicationStyle", "learningPreferences", "weaknesses"] as const;
  const data: Record<string, string | null> = {};
  for (const field of fields) {
    if (field in body) data[field] = typeof body[field] === "string" ? body[field] : null;
  }

  const existing = await prisma.studentProfile.findFirst();
  const profile = existing
    ? await prisma.studentProfile.update({ where: { id: existing.id }, data })
    : await prisma.studentProfile.create({ data });

  return NextResponse.json({ profile });
}
