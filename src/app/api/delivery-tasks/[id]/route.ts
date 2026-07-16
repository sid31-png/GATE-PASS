import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeliveryStage } from "@/generated/prisma/client";
import { assertValidTransition } from "@/lib/delivery";

const includeRelations = {
  gatePass: { select: { id: true, number: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.deliveryTask.findUnique({
    where: { id: Number(id) },
    include: includeRelations,
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.deliveryTask.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.gatePassId !== undefined) data.gatePassId = body.gatePassId;
  if (body.companyId !== undefined) data.companyId = body.companyId;
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId;
  if (body.assignedById !== undefined) data.assignedById = body.assignedById;
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }
  if (body.instructions !== undefined) data.instructions = body.instructions || null;
  if (body.blockedReason !== undefined) data.blockedReason = body.blockedReason || null;

  if (body.stage !== undefined) {
    const nextStage = body.stage as DeliveryStage;
    try {
      assertValidTransition(existing.stage, nextStage);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid transition" }, { status: 400 });
    }

    if (nextStage === DeliveryStage.ASSIGNED) {
      const assignedToId = body.assignedToId ?? existing.assignedToId;
      const assignedById = body.assignedById ?? existing.assignedById;
      const scheduledAt = body.scheduledAt !== undefined ? body.scheduledAt : existing.scheduledAt;
      if (!assignedToId || !assignedById || !scheduledAt) {
        return NextResponse.json(
          { error: "Assigning a task requires assignedToId, assignedById (the manager) and scheduledAt." },
          { status: 400 }
        );
      }
    }
    if (nextStage === DeliveryStage.BLOCKED) {
      const blockedReason = body.blockedReason ?? existing.blockedReason;
      if (!blockedReason) {
        return NextResponse.json({ error: "Blocking a task requires a blockedReason comment." }, { status: 400 });
      }
    }
    if (nextStage === DeliveryStage.IN_PROGRESS && !existing.startedAt) {
      data.startedAt = new Date();
    }
    if (nextStage === DeliveryStage.COMPLETED && !existing.completedAt) {
      data.completedAt = new Date();
    }
    data.stage = nextStage;
  }

  const task = await prisma.deliveryTask.update({
    where: { id: Number(id) },
    data,
    include: includeRelations,
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.deliveryTask.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
