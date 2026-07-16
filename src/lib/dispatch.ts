import { prisma } from "@/lib/prisma";

export type DispatchResolution = {
  operatorId: number | null;
  flaggedForManager: boolean;
  assignmentRuleId: number | null;
  partnershipId: number | null;
  note: string;
};

function pickFromPool(pool: string, seed: number): number {
  const ids = pool
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return ids[seed % ids.length];
}

/**
 * Determines which Online Operations employee a service request should be
 * auto-assigned to, applying the binome (AM <-> operator) rules:
 *
 *   1. Company-level AssignmentRule (e.g. "any company containing ABB
 *      round-robins between ALAA and TAHA"), checked by priority, highest first.
 *      This overrides the AM's default partnership.
 *   2. The AM's default Partnership (fixed pair, or a round-robin pool for
 *      shared AMs like Nasma).
 *   3. If neither is configured, returns operatorId: null — the request stays
 *      unassigned until an admin (Ahmed/MED-DARWISH) manually assigns it.
 *
 * Round-robin fairness is derived from how many past requests were already
 * routed through the same rule/partnership (stored on ServiceRequest for
 * auditability), not from a mutable counter.
 */
export async function resolveOnlineOperator(params: {
  companyId: number | null;
  amEmployeeId: number;
}): Promise<DispatchResolution> {
  const { companyId, amEmployeeId } = params;

  const company = companyId ? await prisma.company.findUnique({ where: { id: companyId } }) : null;

  if (company) {
    const rules = await prisma.assignmentRule.findMany({
      where: { active: true, matchType: "COMPANY_NAME_CONTAINS" },
      orderBy: { priority: "desc" },
    });
    const matched = rules.find((r) => company.name.toUpperCase().includes(r.matchValue.toUpperCase()));
    if (matched) {
      const priorCount = await prisma.serviceRequest.count({ where: { assignmentRuleId: matched.id } });
      const operatorId = pickFromPool(matched.operatorIds, priorCount);
      return {
        operatorId,
        flaggedForManager: matched.flagManager,
        assignmentRuleId: matched.id,
        partnershipId: null,
        note: `Auto-assigned via rule "${matched.note ?? matched.matchValue}" (round-robin)`,
      };
    }
  }

  const partnership = await prisma.partnership.findUnique({ where: { amEmployeeId } });
  if (partnership) {
    const priorCount = await prisma.serviceRequest.count({ where: { partnershipId: partnership.id } });
    const operatorId = pickFromPool(partnership.operatorIds, priorCount);
    return {
      operatorId,
      flaggedForManager: partnership.flagManager,
      assignmentRuleId: null,
      partnershipId: partnership.id,
      note: partnership.note ?? "Auto-assigned via the Account Manager's default partnership",
    };
  }

  return {
    operatorId: null,
    flaggedForManager: false,
    assignmentRuleId: null,
    partnershipId: null,
    note: "No partnership configured for this Account Manager — needs manual assignment.",
  };
}
