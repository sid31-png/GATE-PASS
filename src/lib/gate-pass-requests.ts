import { roleOf } from "@/lib/rbac";
import type { EmployeeDTO } from "@/lib/types";

// The Gate Pass request family is only offered for these 4 accounts — every
// other company only has PRO services available.
export const GATE_PASS_ELIGIBLE_COMPANIES = ["EY Consulting", "Tenaris Global", "Tenaris Investment", "Welltec"];

// Per spec, filing a Gate Pass/DVC/Offshore Medical Card request is NOT a
// blanket AM-role permission — only these two named Account Managers, plus
// the admin tier (CEO/SUPER_ADMIN/OPS_ADMIN/AM_LEAD), may do it. Every other
// AM only sees the PRO Service Request button.
const GATE_PASS_CREATOR_AM_NAMES = ["Violetta", "Abegail"];

export function canCreateGatePassRequest(employee: EmployeeDTO | null | undefined): boolean {
  if (!employee) return false;
  const role = roleOf(employee);
  if (role === "CEO" || role === "SUPER_ADMIN" || role === "OPS_ADMIN" || role === "AM_LEAD") return true;
  return GATE_PASS_CREATOR_AM_NAMES.includes(employee.name);
}

export type GatePassRequestKind = "GATE_PASS" | "DVC" | "OFFSHORE_MEDICAL";

export const GATE_PASS_REQUEST_KINDS: { value: GatePassRequestKind; label: string }[] = [
  { value: "GATE_PASS", label: "Gate Pass" },
  { value: "DVC", label: "DVC (Declaration Valid Contract) — tracking only" },
  { value: "OFFSHORE_MEDICAL", label: "Offshore Medical Card" },
];

// serviceType values that only the Gate Pass request modal can produce —
// used server-side to detect a gate-pass-family submission regardless of
// which sub-kind it is, since only `serviceType` (not a dedicated field)
// distinguishes it from a plain PRO service request.
export const GATE_PASS_FAMILY_SERVICE_TYPES = [
  "Permanent Gate Pass",
  "Temporary Gate Pass",
  "DVC (Declaration Valid Contract)",
  "Offshore Medical Card",
];
