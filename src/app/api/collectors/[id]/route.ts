import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const collector = await prisma.collector.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      active: body.active ?? true,
    },
  });
  return NextResponse.json(collector);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.collector.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
