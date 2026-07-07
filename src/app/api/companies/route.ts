import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { gatePasses: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const company = await prisma.company.create({
    data: {
      name: body.name,
      sector: body.sector || null,
      contact: body.contact || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(company, { status: 201 });
}
