import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RequestStatus, DeliveryStage } from "@/generated/prisma/client";
import { assertValidTransition } from "@/lib/service-requests";
import { getSessionEmployee } from "@/lib/session";
import { can } from "@/lib/rbac";

const includeRelations = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  claimedBy: { select: { id: true, name: true } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.serviceRequest.findUnique({
    where: { id: Number(id) },
    include: {
      ...includeRelations,
      history: { include: { changedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const actor = await getSessionEmployee();
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await prisma.serviceRequest.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status === undefined) {
    if (body.claimedById !== undefined) {
      // Manual reassignment (Ops Admin / Super Admin / CEO) — no stage transition.
      if (!can(actor, "reassign_requests")) {
        return NextResponse.json(
          { error: "You don't have permission to reassign this request." },
          { status: 403 }
        );
      }
      const request = await prisma.serviceRequest.update({
        where: { id: Number(id) },
        data: {
          claimedById: body.claimedById,
          claimedAt: body.claimedById ? (existing.claimedAt ?? new Date()) : null,
          assignmentNote: body.assignmentNote ?? "Manually reassigned by an administrator.",
        },
        include: includeRelations,
      });
      await prisma.requestStatusHistory.create({
        data: {
          requestId: request.id,
          fromStatus: existing.status,
          toStatus: existing.status,
          changedById: body.changedById ?? null,
          comment: body.assignmentNote ?? "Manually reassigned by an administrator.",
        },
      });
      return NextResponse.json(request);
    }
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }
  const nextStatus = body.status as RequestStatus;
  try {
    assertValidTransition(existing.status, nextStatus);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid transition" }, { status: 400 });
  }

  const data: Record<string, unknown> = { status: nextStatus };

  if (nextStatus === RequestStatus.ONLINE_PROCESSING) {
    const claimedById = body.claimedById ?? existing.claimedById;
    if (!claimedById) {
      return NextResponse.json({ error: "Claiming a request requires claimedById (the operator)." }, { status: 400 });
    }
    data.claimedById = claimedById;
    data.claimedAt = existing.claimedAt ?? new Date();
  }

  if (nextStatus === RequestStatus.MISSING_INFO_RETURNED_TO_AM) {
    const returnComment = body.returnComment ?? existing.returnComment;
    if (!returnComment) {
      return NextResponse.json({ error: "Returning to the AM requires a comment explaining what's missing." }, { status: 400 });
    }
    data.returnComment = returnComment;
  }

  if (nextStatus === RequestStatus.ASSIGNED_TO_ONLINE && existing.status === RequestStatus.MISSING_INFO_RETURNED_TO_AM) {
    // Resubmitted by the AM: clear the previous claim so it re-enters the queue fresh.
    data.claimedById = null;
    data.claimedAt = null;
    data.returnComment = null;
  }

  let deliveryTaskId: number | null = null;
  if (nextStatus === RequestStatus.PENDING_DISPATCH) {
    if (!existing.claimedById) {
      return NextResponse.json({ error: "A request must be claimed by an operator before it can be sent to dispatch." }, { status: 400 });
    }
    const task = await prisma.deliveryTask.create({
      data: {
        companyId: existing.companyId,
        title: existing.title,
        description: existing.description,
        stage: DeliveryStage.DISPATCH,
        createdById: existing.claimedById,
      },
    });
    deliveryTaskId = task.id;
    data.deliveryTaskId = task.id;
  }

  const request = await prisma.serviceRequest.update({
    where: { id: Number(id) },
    data,
    include: includeRelations,
  });

  await prisma.requestStatusHistory.create({
    data: {
      requestId: request.id,
      fromStatus: existing.status,
      toStatus: nextStatus,
      changedById: body.changedById ?? existing.claimedById ?? existing.createdById,
      comment: nextStatus === RequestStatus.MISSING_INFO_RETURNED_TO_AM ? (data.returnComment as string) : null,
    },
  });

  return NextResponse.json({ ...request, deliveryTaskId });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.requestStatusHistory.deleteMany({ where: { requestId: Number(id) } });
  await prisma.serviceRequest.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
