import { DeliveryStage } from "@/generated/prisma/enums";

export type DeliveryTaskWithRelations = {
  id: number;
  title: string;
  description: string | null;
  stage: DeliveryStage;
  scheduledAt: Date | null;
  instructions: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  blockedReason: string | null;
  createdAt: Date;
  gatePass: { id: number; number: string } | null;
  company: { id: number; name: string } | null;
  createdBy: { id: number; name: string } | null;
  assignedTo: { id: number; name: string } | null;
  assignedBy: { id: number; name: string } | null;
};

export const STAGE_LABEL: Record<DeliveryStage, string> = {
  ONLINE: "Online Prep",
  DISPATCH: "Ready for Dispatch",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

/**
 * The dispatch workflow as a state machine. This is the single source of
 * truth for "how an order moves from Online to Field Delivery":
 *
 *   ONLINE --(internal team finishes prep)--> DISPATCH
 *   DISPATCH --(MED-DARWISH assigns an agent + schedule)--> ASSIGNED
 *   ASSIGNED --(field agent starts the mission)--> IN_PROGRESS
 *   IN_PROGRESS --(field agent finishes)--> COMPLETED
 *   ASSIGNED/IN_PROGRESS --(field agent hits a blocker)--> BLOCKED
 *   BLOCKED --(resolved)--> IN_PROGRESS or back to ASSIGNED
 *
 * Only the DISPATCH -> ASSIGNED transition is manager-gated: the API layer
 * requires assignedToId, assignedById (the manager) and scheduledAt to be
 * set together, which is "validation by MED-DARWISH" in practice.
 */
export const VALID_TRANSITIONS: Record<DeliveryStage, DeliveryStage[]> = {
  ONLINE: ["DISPATCH", "COMPLETED"],
  DISPATCH: ["ASSIGNED", "ONLINE"],
  ASSIGNED: ["IN_PROGRESS", "BLOCKED", "DISPATCH"],
  IN_PROGRESS: ["COMPLETED", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS", "ASSIGNED"],
  COMPLETED: [],
};

export function assertValidTransition(from: DeliveryStage, to: DeliveryStage) {
  if (from === to) return;
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new Error(`Cannot move a task from ${STAGE_LABEL[from]} to ${STAGE_LABEL[to]}.`);
  }
}

export function isOverdue(task: Pick<DeliveryTaskWithRelations, "stage" | "scheduledAt">, now = new Date()) {
  if (!task.scheduledAt) return false;
  if (task.stage !== "ASSIGNED") return false;
  return task.scheduledAt.getTime() < now.getTime();
}

export function computeDispatchKpis(tasks: DeliveryTaskWithRelations[], now = new Date()) {
  const byStage = (s: DeliveryStage) => tasks.filter((t) => t.stage === s).length;
  return {
    total: tasks.length,
    online: byStage("ONLINE"),
    readyForDispatch: byStage("DISPATCH"),
    assigned: byStage("ASSIGNED"),
    inProgress: byStage("IN_PROGRESS"),
    completed: byStage("COMPLETED"),
    blocked: byStage("BLOCKED"),
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
  };
}

export function computeFieldWorkload(tasks: DeliveryTaskWithRelations[]) {
  const active = tasks.filter((t) => t.stage === "ASSIGNED" || t.stage === "IN_PROGRESS" || t.stage === "BLOCKED");
  const byAgent = new Map<string, DeliveryTaskWithRelations[]>();
  for (const t of active) {
    const name = t.assignedTo?.name ?? "(unassigned)";
    if (!byAgent.has(name)) byAgent.set(name, []);
    byAgent.get(name)!.push(t);
  }
  return [...byAgent.entries()]
    .map(([name, list]) => ({ name, count: list.length, tasks: list }))
    .sort((a, b) => b.count - a.count);
}
