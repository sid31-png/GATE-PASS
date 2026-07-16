import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@/generated/prisma/client";
import { resolveOnlineOperator } from "@/lib/dispatch";

const includeRelations = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  claimedBy: { select: { id: true, name: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const statuses = searchParams.get("statuses"); // comma-separated
  const createdById = searchParams.get("createdById");
  const claimedById = searchParams.get("claimedById");

  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...(status ? { status: status as RequestStatus } : {}),
      ...(statuses ? { status: { in: statuses.split(",") as RequestStatus[] } } : {}),
      ...(createdById ? { createdById: Number(createdById) } : {}),
      ...(claimedById ? { claimedById: Number(claimedById) } : {}),
    },
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!body.category || !["PRO", "DELIVERY"].includes(body.category)) {
    return NextResponse.json({ error: "Category must be PRO or DELIVERY" }, { status: 400 });
  }
  if (!body.createdById) {
    return NextResponse.json({ error: "createdById (the Account Manager) is required" }, { status: 400 });
  }

  // Dynamic dispatch: auto-route to the AM's binome operator (with
  // company-level exceptions like ABB) instead of a free-for-all claim queue.
  const resolution = await resolveOnlineOperator({
    companyId: body.companyId ?? null,
    amEmployeeId: body.createdById,
  });

  const request = await prisma.serviceRequest.create({
    data: {
      title: body.title,
      category: body.category,
      companyId: body.companyId ?? null,
      clientName: body.clientName || null,
      description: body.description || null,
      attachments: body.attachments || null,
      status: RequestStatus.ASSIGNED_TO_ONLINE,
      createdById: body.createdById,
      claimedById: resolution.operatorId,
      assignmentRuleId: resolution.assignmentRuleId,
      partnershipId: resolution.partnershipId,
      flaggedForManager: resolution.flaggedForManager,
      assignmentNote: resolution.note,
    },
    include: includeRelations,
  });

  await prisma.requestStatusHistory.create({
    data: {
      requestId: request.id,
      fromStatus: null,
      toStatus: RequestStatus.ASSIGNED_TO_ONLINE,
      changedById: body.createdById,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
