import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const company = await prisma.company.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      sector: body.sector ?? null,
      contact: body.contact ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(company);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.company.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
