import type { Role } from "@/lib/rbac";

// Page-level access rules, checked by src/proxy.ts on every navigation.
// A path not listed here is open to any authenticated employee. Listed
// paths restrict the whole page to the given roles — CEO and SUPER_ADMIN
// are always implicitly allowed regardless of what's listed.
export const ROUTE_ACCESS_RULES: { prefix: string; roles: Role[] }[] = [
  // Terrain dispatch board: MED-DARWISH's exclusive dispatching screen.
  // Account Managers (e.g. Violetta) must be blocked outright, per spec.
  { prefix: "/dispatch", roles: ["CEO", "SUPER_ADMIN", "OPS_ADMIN", "OPERATOR"] },
  { prefix: "/request-queue", roles: ["CEO", "SUPER_ADMIN", "OPS_ADMIN", "OPERATOR"] },
  { prefix: "/online", roles: ["CEO", "SUPER_ADMIN", "OPS_ADMIN", "OPERATOR"] },
  { prefix: "/company-import", roles: ["CEO", "SUPER_ADMIN", "OPS_ADMIN"] },
  { prefix: "/account-managers", roles: ["CEO", "SUPER_ADMIN", "OPS_ADMIN", "AM_LEAD", "AM"] },
];

export function isRouteAllowed(pathname: string, role: Role): boolean {
  if (role === "CEO" || role === "SUPER_ADMIN") return true;
  const rule = ROUTE_ACCESS_RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return true;
  return rule.roles.includes(role);
}
