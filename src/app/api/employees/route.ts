import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // "manager" | "opsAdmin" | "online" | "field" | "am" | "amLead"

  const roleFilter =
    role === "manager"
      ? { isManager: true }
      : role === "opsAdmin"
        ? { isOpsAdmin: true }
        : role === "online"
          ? { isOnline: true }
          : role === "field"
            ? { isField: true }
            : role === "am"
              ? { isAM: true }
              : role === "amLead"
                ? { isAMLead: true }
                : {};

  const employees = await prisma.employee.findMany({
    where: roleFilter,
    orderBy: { name: "asc" },
    select: PUBLIC_EMPLOYEE_SELECT,
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
      isOpsAdmin: Boolean(body.isOpsAdmin),
      isOnline: Boolean(body.isOnline),
      isField: Boolean(body.isField),
      isAM: Boolean(body.isAM),
      isAMLead: Boolean(body.isAMLead),
      phone: body.phone || null,
      email: body.email || null,
      active: body.active ?? true,
    },
    select: PUBLIC_EMPLOYEE_SELECT,
  });
  return NextResponse.json(employee, { status: 201 });
}
