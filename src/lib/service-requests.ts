import { RequestStatus } from "@/generated/prisma/enums";

export type ServiceRequestWithRelations = {
  id: number;
  title: string;
  category: "PRO" | "DELIVERY";
  description: string | null;
  attachments: string | null;
  clientName: string | null;
  status: RequestStatus;
  claimedAt: Date | null;
  returnComment: string | null;
  createdAt: Date;
  company: { id: number; name: string } | null;
  createdBy: { id: number; name: string };
  claimedBy: { id: number; name: string } | null;
  deliveryTaskId: number | null;
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  ASSIGNED_TO_ONLINE: "Assigned to Online",
  ONLINE_PROCESSING: "Online Processing",
  PENDING_DISPATCH: "Pending Dispatch",
  MISSING_INFO_RETURNED_TO_AM: "Missing Info (Returned to AM)",
};

/**
 * AM -> Online Operations intake workflow, the "front door" that feeds the
 * existing Dispatch board:
 *
 *   ASSIGNED_TO_ONLINE --(operator clicks "Prendre en charge")--> ONLINE_PROCESSING
 *   ONLINE_PROCESSING --(documents OK, "Prêt pour Dispatch")--> PENDING_DISPATCH
 *                          (a DeliveryTask is created for MED-DARWISH)
 *   ONLINE_PROCESSING --(missing/invalid document, "Retourner à l'AM")--> MISSING_INFO_RETURNED_TO_AM
 *   MISSING_INFO_RETURNED_TO_AM --(AM fixes it with the client, resubmits)--> ASSIGNED_TO_ONLINE
 */
export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  ASSIGNED_TO_ONLINE: ["ONLINE_PROCESSING"],
  ONLINE_PROCESSING: ["PENDING_DISPATCH", "MISSING_INFO_RETURNED_TO_AM"],
  PENDING_DISPATCH: [],
  MISSING_INFO_RETURNED_TO_AM: ["ASSIGNED_TO_ONLINE"],
};

export function assertValidTransition(from: RequestStatus, to: RequestStatus) {
  if (from === to) return;
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new Error(`Cannot move a request from ${STATUS_LABEL[from]} to ${STATUS_LABEL[to]}.`);
  }
}

export function computeAMKpis(requests: ServiceRequestWithRelations[]) {
  const byStatus = (s: RequestStatus) => requests.filter((r) => r.status === s).length;
  return {
    total: requests.length,
    assignedToOnline: byStatus("ASSIGNED_TO_ONLINE"),
    onlineProcessing: byStatus("ONLINE_PROCESSING"),
    pendingDispatch: byStatus("PENDING_DISPATCH"),
    missingInfo: byStatus("MISSING_INFO_RETURNED_TO_AM"),
  };
}

export function computeOnlineQueueKpis(requests: ServiceRequestWithRelations[]) {
  const byStatus = (s: RequestStatus) => requests.filter((r) => r.status === s).length;
  return {
    incoming: byStatus("ASSIGNED_TO_ONLINE"),
    inProgress: byStatus("ONLINE_PROCESSING"),
    readyForDispatch: byStatus("PENDING_DISPATCH"),
    returnedToAM: byStatus("MISSING_INFO_RETURNED_TO_AM"),
  };
}
