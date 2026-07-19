import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import type { Employee } from "@/generated/prisma/client";

// Server-side helper: resolves the signed session cookie to the current
// Employee row. Used by server components (layout.tsx) and API routes to
// derive the actor instead of trusting a client-supplied employee id.
export async function getSessionEmployee(): Promise<Employee | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const employee = await prisma.employee.findUnique({ where: { id: payload.id } });
  if (!employee || !employee.active) return null;
  return employee;
}
