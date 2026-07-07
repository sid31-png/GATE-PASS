import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const collectors = await prisma.collector.findMany({
    include: { _count: { select: { gatePasses: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(collectors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const collector = await prisma.collector.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      active: body.active ?? true,
    },
  });
  return NextResponse.json(collector, { status: 201 });
}
