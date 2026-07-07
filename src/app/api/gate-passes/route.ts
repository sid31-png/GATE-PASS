import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GatePassStatus, Location } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const companyId = searchParams.get("companyId");
  const collectorId = searchParams.get("collectorId");
  const location = searchParams.get("location");
  const search = searchParams.get("search");

  const gatePasses = await prisma.gatePass.findMany({
    where: {
      ...(status ? { status: status as GatePassStatus } : {}),
      ...(companyId ? { companyId: Number(companyId) } : {}),
      ...(collectorId ? { collectorId: Number(collectorId) } : {}),
      ...(location ? { location: location as Location } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search } },
              { company: { name: { contains: search } } },
              { submittedBy: { contains: search } },
            ],
          }
        : {}),
    },
    include: { company: true, collector: true },
    orderBy: { submissionAt: "desc" },
  });

  return NextResponse.json(gatePasses);
}

async function resolveCompanyId(body: { companyId?: number; companyName?: string }) {
  if (body.companyId) return body.companyId;
  if (body.companyName) {
    const existing = await prisma.company.findUnique({ where: { name: body.companyName } });
    if (existing) return existing.id;
    const created = await prisma.company.create({ data: { name: body.companyName } });
    return created.id;
  }
  throw new Error("companyId or companyName is required");
}

function nextGatePassNumber(count: number) {
  const year = new Date().getFullYear();
  return `GP-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (
    !body.location ||
    !body.gatePassType ||
    !body.requestType ||
    !body.passCategory ||
    !body.submittedBy ||
    !body.submissionAt
  ) {
    return NextResponse.json(
      {
        error:
          "location, gatePassType, requestType, passCategory, submittedBy and submissionAt are required",
      },
      { status: 400 }
    );
  }

  let companyId: number;
  try {
    companyId = await resolveCompanyId(body);
  } catch {
    return NextResponse.json({ error: "companyId or companyName is required" }, { status: 400 });
  }

  const count = await prisma.gatePass.count();
  const number = body.number || nextGatePassNumber(count);

  const gatePass = await prisma.gatePass.create({
    data: {
      number,
      companyId,
      location: body.location,
      gatePassType: body.gatePassType,
      requestType: body.requestType,
      passCategory: body.passCategory,
      submittedBy: body.submittedBy,
      submissionAt: new Date(body.submissionAt),
      collectorId: body.collectorId ?? null,
      collectionAt: body.collectionAt ? new Date(body.collectionAt) : null,
      status: body.status ?? GatePassStatus.PENDING,
      remarks: body.remarks || null,
    },
    include: { company: true, collector: true },
  });

  return NextResponse.json(gatePass, { status: 201 });
}
