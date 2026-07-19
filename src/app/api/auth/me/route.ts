import { NextResponse } from "next/server";
import { getSessionEmployee } from "@/lib/session";

export async function GET() {
  const employee = await getSessionEmployee();
  if (!employee) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id, name, isCEO, isManager, isOpsAdmin, isOnline, isField, isAM, isAMLead, phone, email, active } = employee;
  return NextResponse.json({ id, name, isCEO, isManager, isOpsAdmin, isOnline, isField, isAM, isAMLead, phone, email, active });
}
