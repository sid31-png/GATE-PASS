import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_S } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const employeeId = Number(body?.employeeId);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!employeeId || !password) {
    return NextResponse.json({ error: "Profile and password are required." }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });

  // Field agents have no login account; unknown/inactive employees are also rejected.
  if (!employee || !employee.active || !employee.passwordHash) {
    return NextResponse.json({ error: "Invalid profile or password." }, { status: 401 });
  }

  if (!verifyPassword(password, employee.passwordHash)) {
    return NextResponse.json({ error: "Invalid profile or password." }, { status: 401 });
  }

  const token = createSessionToken(employee.id, {
    isCEO: employee.isCEO,
    isManager: employee.isManager,
    isOpsAdmin: employee.isOpsAdmin,
    isOnline: employee.isOnline,
    isField: employee.isField,
    isAM: employee.isAM,
    isAMLead: employee.isAMLead,
  });
  const res = NextResponse.json({
    id: employee.id,
    name: employee.name,
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_COOKIE_MAX_AGE_S,
    path: "/",
  });
  return res;
}
