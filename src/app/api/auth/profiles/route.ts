import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roleOf, ROLE_LABEL } from "@/lib/rbac";

// Public (unauthenticated) endpoint — powers the profile picker on the
// pre-dashboard login screen. Only exposes id/name/role, never passwordHash.
// Field agents have no passwordHash (no login account) so they're excluded.
export async function GET() {
  const employees = await prisma.employee.findMany({
    where: { active: true, passwordHash: { not: null } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: roleOf(e),
      roleLabel: ROLE_LABEL[roleOf(e)],
    }))
  );
}
