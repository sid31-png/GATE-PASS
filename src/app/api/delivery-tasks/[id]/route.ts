import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeliveryStage } from "@/generated/prisma/client";
import { assertValidTransition } from "@/lib/delivery";
import { getSessionEmployee } from "@/lib/session";
import { can } from "@/lib/rbac";

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

  const actor = await getSessionEmployee();
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await prisma.deliveryTask.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reassigning who's on a field mission is the same exclusive dispatch
  // action as first assigning it, even when the stage itself doesn't change.
  if (body.assignedToId !== undefined && body.assignedToId !== existing.assignedToId && !can(actor, "dispatch_field_assign")) {
    return NextResponse.json(
      { error: "Only the Super Admin dispatcher (or the CEO) can assign or reassign field agents." },
      { status: 403 }
    );
  }

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

    // Assigning the field agent + instructions, and validating a completed
    // delivery, are MED-DARWISH/CEO's exclusive dispatch actions. Relaying
    // the field agent's own progress (started / blocked) is looser — Online
    // Operators may log that too.
    const exclusiveDispatchStage = nextStage === DeliveryStage.ASSIGNED || nextStage === DeliveryStage.COMPLETED;
    const permission = exclusiveDispatchStage ? "dispatch_field_assign" : "update_field_status";
    if (!can(actor, permission)) {
      return NextResponse.json(
        {
          error: exclusiveDispatchStage
            ? "Only the Super Admin dispatcher (or the CEO) can assign field agents or validate a completed delivery."
            : "You don't have permission to update this mission's status.",
        },
        { status: 403 }
      );
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
  const actor = await getSessionEmployee();
  if (!actor || !can(actor, "dispatch_field_assign")) {
    return NextResponse.json({ error: "Only the Super Admin dispatcher (or the CEO) can delete a delivery task." }, { status: 403 });
  }
  await prisma.deliveryTask.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
