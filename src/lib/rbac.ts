export type Role = "SUPER_ADMIN" | "OPS_ADMIN" | "OPERATOR" | "AM_LEAD" | "AM" | "FIELD" | "UNASSIGNED";

export type RoleSubject = {
  isManager: boolean;
  isOpsAdmin: boolean;
  isOnline: boolean;
  isField: boolean;
  isAM: boolean;
  isAMLead: boolean;
};

/**
 * Role hierarchy (highest to lowest), matching the access matrix:
 *   SUPER_ADMIN (MED-DARWISH) — full read/write/config access to everything.
 *   OPS_ADMIN    (AHMED)      — supervises the whole online queue, can reassign,
 *                               configures dispatch settings, plus own binome tasks.
 *   AM_LEAD      (ELENA)      — sees every Account Manager's requests.
 *   OPERATOR  (ALAA/SAMIM/TAHA/MUJEEB) — sees only tasks auto-assigned to them.
 *   AM        (Violetta, Abegail, Vongai, Nasma, Roxana, Gabriela) — own requests.
 *   FIELD                     — field/government-trip missions.
 */
export function roleOf(e: RoleSubject | null | undefined): Role {
  if (!e) return "UNASSIGNED";
  if (e.isManager) return "SUPER_ADMIN";
  if (e.isOpsAdmin) return "OPS_ADMIN";
  if (e.isAMLead) return "AM_LEAD";
  if (e.isOnline) return "OPERATOR";
  if (e.isAM) return "AM";
  if (e.isField) return "FIELD";
  return "UNASSIGNED";
}

export const ROLE_LABEL: Record<Role, string> = {
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
  | "view_all_am_requests";

const PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ["view_all_online_queue", "reassign_requests", "import_companies", "configure_dispatch", "view_all_am_requests"],
  OPS_ADMIN: ["view_all_online_queue", "reassign_requests", "import_companies", "configure_dispatch"],
  AM_LEAD: ["view_all_am_requests"],
  OPERATOR: [],
  AM: [],
  FIELD: [],
  UNASSIGNED: [],
};

export function can(e: RoleSubject | null | undefined, permission: Permission): boolean {
  return PERMISSIONS[roleOf(e)].includes(permission);
}
