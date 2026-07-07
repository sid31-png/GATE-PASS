import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: Number(id) },
    include: { company: true, collector: true },
  });
  if (!gatePass) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(gatePass);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.number !== undefined) data.number = body.number;
  if (body.companyId !== undefined) data.companyId = body.companyId;
  if (body.location !== undefined) data.location = body.location;
  if (body.gatePassType !== undefined) data.gatePassType = body.gatePassType;
  if (body.requestType !== undefined) data.requestType = body.requestType;
  if (body.passCategory !== undefined) data.passCategory = body.passCategory;
  if (body.submittedBy !== undefined) data.submittedBy = body.submittedBy;
  if (body.submissionAt !== undefined) data.submissionAt = new Date(body.submissionAt);
  if (body.collectorId !== undefined) data.collectorId = body.collectorId;
  if (body.collectionAt !== undefined) {
    data.collectionAt = body.collectionAt ? new Date(body.collectionAt) : null;
  }
  if (body.status !== undefined) data.status = body.status;
  if (body.remarks !== undefined) data.remarks = body.remarks || null;

  const gatePass = await prisma.gatePass.update({
    where: { id: Number(id) },
    data,
    include: { company: true, collector: true },
  });

  return NextResponse.json(gatePass);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.gatePass.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
