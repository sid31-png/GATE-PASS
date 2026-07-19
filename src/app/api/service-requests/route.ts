import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@/generated/prisma/client";
import { resolveOnlineOperator } from "@/lib/dispatch";
import { getSessionEmployee } from "@/lib/session";
import { can, roleOf } from "@/lib/rbac";
import { canCreateGatePassRequest, GATE_PASS_ELIGIBLE_COMPANIES, GATE_PASS_FAMILY_SERVICE_TYPES } from "@/lib/gate-pass-requests";

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
  const actor = await getSessionEmployee();
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!can(actor, "create_service_request")) {
    return NextResponse.json(
      { error: "Your role can't create service requests. Only Account Managers, the AM Lead, and admins can." },
      { status: 403 }
    );
  }

  const body = await req.json();
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!body.category || !["PRO", "DELIVERY"].includes(body.category)) {
    return NextResponse.json({ error: "Category must be PRO or DELIVERY" }, { status: 400 });
  }

  // A plain AM may only file on their own behalf — the client-sent
  // createdById is ignored for that role and forced to the session's own id.
  // AM_LEAD/CEO/SUPER_ADMIN may file on behalf of any Account Manager.
  const role = roleOf(actor);
  let createdById = actor.id;
  if (role === "AM_LEAD" || role === "CEO" || role === "SUPER_ADMIN") {
    if (!body.createdById) {
      return NextResponse.json({ error: "createdById (the Account Manager) is required" }, { status: 400 });
    }
    const target = await prisma.employee.findUnique({ where: { id: Number(body.createdById) } });
    if (!target?.isAM) {
      return NextResponse.json({ error: "createdById must be an Account Manager." }, { status: 400 });
    }
    createdById = target.id;
  }

  // Gate Pass / DVC / Offshore Medical Card requests are restricted to the
  // 4 eligible companies and to a named-user whitelist (not the whole AM
  // role) — enforced server-side regardless of what the client sends.
  if (body.serviceType && GATE_PASS_FAMILY_SERVICE_TYPES.includes(body.serviceType)) {
    if (!canCreateGatePassRequest(actor)) {
      return NextResponse.json(
        { error: "Your account isn't eligible to file Gate Pass / DVC / Offshore Medical Card requests." },
        { status: 403 }
      );
    }
    if (body.companyId) {
      const company = await prisma.company.findUnique({ where: { id: Number(body.companyId) } });
      if (!company || !GATE_PASS_ELIGIBLE_COMPANIES.includes(company.name)) {
        return NextResponse.json(
          { error: "Gate Pass requests are only available for EY Consulting, Tenaris Global, Tenaris Investment, and Welltec." },
          { status: 400 }
        );
      }
    }
  }

  // Dynamic dispatch: auto-route to the AM's binome operator (with
  // company-level exceptions like ABB) instead of a free-for-all claim queue.
  const resolution = await resolveOnlineOperator({
    companyId: body.companyId ?? null,
    amEmployeeId: createdById,
  });

  const request = await prisma.serviceRequest.create({
    data: {
      title: body.title,
      category: body.category,
      serviceType: body.serviceType || null,
      location: body.location || null,
      gatePassType: body.gatePassType || null,
      requestType: body.requestType || null,
      passCategory: body.passCategory || null,
      companyId: body.companyId ?? null,
      clientName: body.clientName || null,
      description: body.description || null,
      attachments: body.attachments || null,
      status: RequestStatus.ASSIGNED_TO_ONLINE,
      createdById,
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
      changedById: createdById,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
