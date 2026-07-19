export type Role = "CEO" | "SUPER_ADMIN" | "OPS_ADMIN" | "OPERATOR" | "AM_LEAD" | "AM" | "FIELD" | "UNASSIGNED";

export type RoleSubject = {
  isCEO: boolean;
  isManager: boolean;
  isOpsAdmin: boolean;
  isOnline: boolean;
  isField: boolean;
  isAM: boolean;
  isAMLead: boolean;
};

/**
 * Role hierarchy (highest to lowest), matching the access matrix:
 *   CEO          (Mr. Tayseer) — absolute full access, no exceptions.
 *   SUPER_ADMIN  (MED-DARWISH) — full read/write/config access to everything,
 *                                plus the only role (besides CEO) that can
 *                                assign field dispatch (dispatch_field_assign).
 *   OPS_ADMIN    (AHMED)       — supervises the whole online queue, can reassign,
 *                                configures dispatch settings, plus own binome
 *                                tasks — but NOT field-dispatch-assign and NOT
 *                                creating AM service requests.
 *   AM_LEAD      (ELENA)       — sees every Account Manager's requests, can
 *                                create a request for any client, and — like
 *                                MED-DARWISH — may open a case and choose the
 *                                field agent for a delivery/mission
 *                                (dispatch_field_assign).
 *   OPERATOR  (ALAA/SAMIM/TAHA/MUJEEB) — sees only tasks auto-assigned to them,
 *                                may update field mission status if needed.
 *   AM        (Violetta, Abegail, Vongai, Nasma, Roxana, Gabriela) — own
 *                                requests only; the only role (with AM_LEAD/
 *                                CEO/SUPER_ADMIN) that may create a request.
 *   FIELD                      — field/government-trip agent, no login account.
 */
export function roleOf(e: RoleSubject | null | undefined): Role {
  if (!e) return "UNASSIGNED";
  if (e.isCEO) return "CEO";
  if (e.isManager) return "SUPER_ADMIN";
  if (e.isOpsAdmin) return "OPS_ADMIN";
  if (e.isAMLead) return "AM_LEAD";
  if (e.isOnline) return "OPERATOR";
  if (e.isAM) return "AM";
  if (e.isField) return "FIELD";
  return "UNASSIGNED";
}

export const ROLE_LABEL: Record<Role, string> = {
  CEO: "CEO",
  SUPER_ADMIN: "Super Admin",
  OPS_ADMIN: "Operations Admin",
  OPERATOR: "Online Operator",
  AM_LEAD: "Account Manager Lead",
  AM: "Account Manager",
  FIELD: "Field Agent",
  UNASSIGNED: "Unassigned",
};

export type Permission =
  | "view_all_online_queue"
  | "reassign_requests"
  | "import_companies"
  | "configure_dispatch"
  | "view_all_am_requests"
  | "create_service_request"
  // Dispatch board's exclusive actions per spec: "assigner un agent externe,
  // définir les instructions, valider les livraisons" — assigning/reassigning
  // a field agent + instructions, and marking a mission COMPLETED (validating
  // the delivery). CEO + SUPER_ADMIN + AM_LEAD (ELENA) only — explicitly
  // excluding OPS_ADMIN and plain Online Operators/AMs.
  | "dispatch_field_assign"
  // Relaying a field agent's own-reported progress (mission started / blocked
  // / resumed) — not the exclusive assign-or-validate actions above. Allowed
  // for Online Operators too ("ou les opérateurs en ligne si nécessaire").
  | "update_field_status"
  // Gate Pass + PRO services statistics dashboard (the root "/" page's
  // charts/KPIs). Only the admin tier sees it — a plain AM's or Operator's
  // own "/" is their AM/Online Queue work instead (see app/page.tsx).
  | "view_dashboard_stats";

// CEO and SUPER_ADMIN bypass this table entirely (see `can` below) — this
// map only needs to describe the narrower roles.
const PERMISSIONS: Record<Role, Permission[]> = {
  CEO: [],
  SUPER_ADMIN: [],
  OPS_ADMIN: ["view_all_online_queue", "reassign_requests", "import_companies", "configure_dispatch", "update_field_status", "view_dashboard_stats"],
  AM_LEAD: ["view_all_am_requests", "create_service_request", "dispatch_field_assign", "view_dashboard_stats"],
  OPERATOR: ["update_field_status"],
  AM: ["create_service_request"],
  FIELD: [],
  UNASSIGNED: [],
};

export function can(e: RoleSubject | null | undefined, permission: Permission): boolean {
  const role = roleOf(e);
  if (role === "CEO" || role === "SUPER_ADMIN") return true;
  return PERMISSIONS[role].includes(permission);
}
