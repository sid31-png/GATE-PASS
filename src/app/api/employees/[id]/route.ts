import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.isManager !== undefined) data.isManager = Boolean(body.isManager);
  if (body.isOnline !== undefined) data.isOnline = Boolean(body.isOnline);
  if (body.isField !== undefined) data.isField = Boolean(body.isField);
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.active !== undefined) data.active = Boolean(body.active);

  const employee = await prisma.employee.update({ where: { id: Number(id) }, data });
  return NextResponse.json(employee);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.employee.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
