import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // "manager" | "online" | "field"

  const roleFilter =
    role === "manager"
      ? { isManager: true }
      : role === "online"
        ? { isOnline: true }
        : role === "field"
          ? { isField: true }
          : {};

  const employees = await prisma.employee.findMany({
    where: roleFilter,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const employee = await prisma.employee.create({
    data: {
      name: body.name,
      isManager: Boolean(body.isManager),
      isOnline: Boolean(body.isOnline),
      isField: Boolean(body.isField),
      phone: body.phone || null,
      email: body.email || null,
      active: body.active ?? true,
    },
  });
  return NextResponse.json(employee, { status: 201 });
}
