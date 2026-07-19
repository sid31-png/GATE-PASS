// Catalog of PRO (Public Relations Officer) service types offered to clients.
// Shown as a grouped dropdown in the AM "New Request" form when category = PRO.

export type ProServiceGroup = {
  group: string;
  services: string[];
};

export const PRO_SERVICE_CATALOG: ProServiceGroup[] = [
  {
    group: "Gate Passes",
    services: ["Permanent Gate Pass", "Temporary Gate Pass"],
  },
  {
    group: "Creation & Licenses",
    services: [
      "Commercial Registration (CR)",
      "Computer Card (Establishment Card)",
      "Trade License (Municipality)",
      "Chamber of Commerce Registration",
    ],
  },
  {
    group: "Visas & Immigration",
    services: [
      "Work Visa Quota",
      "Qatar ID (QID) / Residency Permit",
      "Family Visa",
      "Business Visit Visa",
      "Sponsorship Transfer",
      "Visa Cancellation",
    ],
  },
  {
    group: "Ministerial Relations",
    services: [
      "Employment Contract (Ministry of Labour)",
      "MOFA Legalization",
      "Contract Attestation (Ministry of Justice)",
    ],
  },
  {
    group: "Attestations & Translations",
    services: ["Certified Arabic Translation", "Degree / Corporate Document Attestation"],
  },
];

export const PRO_SERVICE_TYPES: string[] = PRO_SERVICE_CATALOG.flatMap((g) => g.services);

// Gate Pass requests get their own dedicated form (location, gate pass type,
// request type, pass category) — excluded here to avoid offering the same
// thing twice in the generic PRO service dropdown.
export const PRO_SERVICE_CATALOG_NO_GATE_PASS: ProServiceGroup[] = PRO_SERVICE_CATALOG.filter(
  (g) => g.group !== "Gate Passes"
);
