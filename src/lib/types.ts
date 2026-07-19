export type CompanyDTO = {
  id: number;
  name: string;
  sector: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  _count?: { gatePasses: number };
};

export type CollectorDTO = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  _count?: { gatePasses: number };
};

export type GatePassDTO = {
  id: number;
  number: string;
  location: "DOHA_TOWERS" | "MESAIEED" | "RAS_LAFFAN" | "DUKHAN" | "OFFSHORE";
  gatePassType: "PERMANENT" | "TEMPORARY";
  requestType: "NEW" | "LOST";
  passCategory: "MAIN" | "SUPPLEMENTARY";
  submittedBy: string;
  submissionAt: string;
  collectionAt: string | null;
  status: "PENDING" | "COLLECTED" | "CANCELLED";
  remarks: string | null;
  company: { id: number; name: string };
  collector: { id: number; name: string } | null;
};

export const LOCATIONS: { value: GatePassDTO["location"]; label: string }[] = [
  { value: "DOHA_TOWERS", label: "Doha Towers" },
  { value: "MESAIEED", label: "Mesaieed" },
  { value: "RAS_LAFFAN", label: "Ras Laffan" },
  { value: "DUKHAN", label: "Dukhan" },
  { value: "OFFSHORE", label: "Offshore" },
];
export const LOCATION_LABEL: Record<string, string> = Object.fromEntries(
  LOCATIONS.map((l) => [l.value, l.label])
);

export const GATE_PASS_TYPES: { value: GatePassDTO["gatePassType"]; label: string }[] = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "TEMPORARY", label: "Temporary" },
];
export const GATE_PASS_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  GATE_PASS_TYPES.map((t) => [t.value, t.label])
);

export const REQUEST_TYPES: { value: GatePassDTO["requestType"]; label: string }[] = [
  { value: "NEW", label: "New Gate Pass" },
  { value: "LOST", label: "Lost Gate Pass" },
];
export const REQUEST_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  REQUEST_TYPES.map((t) => [t.value, t.label])
);

export const PASS_CATEGORIES: { value: GatePassDTO["passCategory"]; label: string }[] = [
  { value: "MAIN", label: "Main" },
  { value: "SUPPLEMENTARY", label: "Supplementary" },
];
export const PASS_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  PASS_CATEGORIES.map((c) => [c.value, c.label])
);

/* ================= Delivery / Dispatch ================= */

export type EmployeeDTO = {
  id: number;
  name: string;
  isCEO: boolean;
  isManager: boolean;
  isOpsAdmin: boolean;
  isOnline: boolean;
  isField: boolean;
  isAM: boolean;
  isAMLead: boolean;
  phone: string | null;
  email: string | null;
  active: boolean;
};

export type DeliveryStageValue = "ONLINE" | "DISPATCH" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type DeliveryTaskDTO = {
  id: number;
  title: string;
  description: string | null;
  stage: DeliveryStageValue;
  scheduledAt: string | null;
  instructions: string | null;
  startedAt: string | null;
  completedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
  gatePass: { id: number; number: string } | null;
  company: { id: number; name: string } | null;
  createdBy: { id: number; name: string } | null;
  assignedTo: { id: number; name: string } | null;
  assignedBy: { id: number; name: string } | null;
};

/* ================= Account Manager / Online Operations intake ================= */

export type RequestCategoryValue = "PRO" | "DELIVERY";
export type RequestStatusValue =
  | "ASSIGNED_TO_ONLINE"
  | "ONLINE_PROCESSING"
  | "PENDING_DISPATCH"
  | "MISSING_INFO_RETURNED_TO_AM";

export type ServiceRequestDTO = {
  id: number;
  title: string;
  category: RequestCategoryValue;
  serviceType: string | null;
  description: string | null;
  attachments: string | null;
  clientName: string | null;
  status: RequestStatusValue;
  claimedAt: string | null;
  returnComment: string | null;
  createdAt: string;
  deliveryTaskId: number | null;
  flaggedForManager: boolean;
  assignmentNote: string | null;
  company: { id: number; name: string } | null;
  createdBy: { id: number; name: string };
  claimedBy: { id: number; name: string } | null;
};

export type PartnershipDTO = {
  id: number;
  amEmployeeId: number;
  operatorIds: string;
  flagManager: boolean;
  note: string | null;
  amEmployee: { id: number; name: string };
};

export type AssignmentRuleDTO = {
  id: number;
  matchType: string;
  matchValue: string;
  operatorIds: string;
  priority: number;
  flagManager: boolean;
  note: string | null;
  active: boolean;
};

export type RequestHistoryDTO = {
  id: number;
  fromStatus: RequestStatusValue | null;
  toStatus: RequestStatusValue;
  comment: string | null;
  createdAt: string;
  changedBy: { id: number; name: string } | null;
};
