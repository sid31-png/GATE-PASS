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
  requestType: string;
  submittedBy: string;
  submissionAt: string;
  collectionAt: string | null;
  status: "PENDING" | "COLLECTED" | "CANCELLED";
  remarks: string | null;
  company: { id: number; name: string };
  collector: { id: number; name: string } | null;
};

export const REQUEST_TYPES = [
  "New Gate Pass",
  "Renewal",
  "Vehicle Pass",
  "Visitor Pass",
  "Replacement",
];
