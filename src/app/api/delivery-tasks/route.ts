import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeliveryStage } from "@/generated/prisma/client";

const includeRelations = {
  gatePass: { select: { id: true, number: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const stages = searchParams.get("stages"); // comma-separated
  const assignedToId = searchParams.get("assignedToId");

  const tasks = await prisma.deliveryTask.findMany({
    where: {
      ...(stage ? { stage: stage as DeliveryStage } : {}),
      ...(stages ? { stage: { in: stages.split(",") as DeliveryStage[] } } : {}),
      ...(assignedToId ? { assignedToId: Number(assignedToId) } : {}),
    },
    include: includeRelations,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const task = await prisma.deliveryTask.create({
    data: {
      title: body.title,
      description: body.description || null,
      stage: body.stage ?? DeliveryStage.ONLINE,
      gatePassId: body.gatePassId ?? null,
      companyId: body.companyId ?? null,
      createdById: body.createdById ?? null,
      assignedToId: body.assignedToId ?? null,
      assignedById: body.assignedById ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      instructions: body.instructions || null,
    },
    include: includeRelations,
  });

  return NextResponse.json(task, { status: 201 });
}
