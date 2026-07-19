import {
  PrismaClient,
  GatePassStatus,
  GatePassType,
  RequestType,
  PassCategory,
  Location,
  DeliveryStage,
  RequestCategory,
  RequestStatus,
} from "../src/generated/prisma/client";
import seedData from "./data/gatepass_seed.json";
import companyAllocation from "./data/company_am_allocation.json";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const COMPANY_SECTORS: Record<string, string> = {
  "EY Consulting": "Professional Services",
  Welltec: "Oilfield Services",
  "Tenaris Global": "Energy Manufacturing",
  "Tenaris Investment": "Investment & Holding",
};

function statusFromLabel(label: string): GatePassStatus {
  switch (label) {
    case "Collected":
      return GatePassStatus.COLLECTED;
    case "Cancelled":
      return GatePassStatus.CANCELLED;
    default:
      return GatePassStatus.PENDING;
  }
}

function gatePassTypeFromLabel(label: string): GatePassType {
  return label === "Permanent" ? GatePassType.PERMANENT : GatePassType.TEMPORARY;
}

function requestTypeFromLabel(label: string): RequestType {
  return label === "Lost Gate Pass" ? RequestType.LOST : RequestType.NEW;
}

function passCategoryFromLabel(label: string): PassCategory {
  return label === "Supplementary" ? PassCategory.SUPPLEMENTARY : PassCategory.MAIN;
}

const LOCATION_MAP: Record<string, Location> = {
  "Doha Towers": Location.DOHA_TOWERS,
  Mesaieed: Location.MESAIEED,
  "Ras Laffan": Location.RAS_LAFFAN,
  Dukhan: Location.DUKHAN,
  Offshore: Location.OFFSHORE,
};

// The real delivery/dispatch/AM team roster. `password` is the demo login
// password for login-capable employees (hashed before insert, never stored
// in plaintext) — field-only agents have no `password` and therefore no
// login account, per spec (their missions are entered on their behalf).
const DEMO_PASSWORD_SUFFIX = "@Rch2026";
const EMPLOYEES: {
  name: string;
  isCEO?: boolean;
  isManager?: boolean;
  isOpsAdmin?: boolean;
  isOnline?: boolean;
  isField?: boolean;
  isAM?: boolean;
  isAMLead?: boolean;
  password?: string;
}[] = [
  { name: "Tayseer", isCEO: true, password: `Tayseer${DEMO_PASSWORD_SUFFIX}` },
  { name: "MED-DARWISH", isManager: true, password: `MedDarwish${DEMO_PASSWORD_SUFFIX}` },
  { name: "ALAA", isOnline: true, isField: true, password: `Alaa${DEMO_PASSWORD_SUFFIX}` },
  { name: "AHMED", isOnline: true, isOpsAdmin: true, password: `Ahmed${DEMO_PASSWORD_SUFFIX}` },
  { name: "SAMIM", isOnline: true, isField: true, password: `Samim${DEMO_PASSWORD_SUFFIX}` },
  { name: "TAHA", isOnline: true, isField: true, password: `Taha${DEMO_PASSWORD_SUFFIX}` },
  { name: "MUJEEB", isOnline: true, isField: true, password: `Mujeeb${DEMO_PASSWORD_SUFFIX}` },
  { name: "SALAH", isField: true },
  { name: "MED-HUSSAIN", isField: true },
  { name: "ABIN", isField: true },
  { name: "AITA", isField: true },
  { name: "ELENA", isAM: true, isAMLead: true, password: `Elena${DEMO_PASSWORD_SUFFIX}` },
  { name: "Violetta", isAM: true, password: `Violetta${DEMO_PASSWORD_SUFFIX}` },
  { name: "Abegail", isAM: true, password: `Abegail${DEMO_PASSWORD_SUFFIX}` },
  { name: "Vongai", isAM: true, password: `Vongai${DEMO_PASSWORD_SUFFIX}` },
  { name: "Nasma", isAM: true, password: `Nasma${DEMO_PASSWORD_SUFFIX}` },
  { name: "Roxana", isAM: true, password: `Roxana${DEMO_PASSWORD_SUFFIX}` },
  { name: "Gabriela", isAM: true, password: `Gabriela${DEMO_PASSWORD_SUFFIX}` },
];

// Default AM <-> Online Operator binomes. A single operator name is a fixed
// pair; multiple names round-robin (Nasma is shared between Ahmed and ALAA).
const PARTNERSHIPS: { amName: string; operatorNames: string[]; flagManager?: boolean; note?: string }[] = [
  { amName: "Violetta", operatorNames: ["AHMED"] },
  { amName: "Abegail", operatorNames: ["SAMIM"] },
  { amName: "Vongai", operatorNames: ["ALAA"] },
  { amName: "Roxana", operatorNames: ["SAMIM"] },
  { amName: "Nasma", operatorNames: ["AHMED", "ALAA"], note: "Shared between Ahmed and ALAA (round-robin)." },
  {
    amName: "Gabriela",
    operatorNames: ["ALAA"],
    flagManager: true,
    note: "External \"OUR partners\" accounts — online prep to ALAA, field validation direct to MED-DARWISH.",
  },
  {
    amName: "ELENA",
    operatorNames: ["TAHA"],
    flagManager: true,
    note: "AM Lead's own requests — flagged for MED-DARWISH's direct supervision.",
  },
];

// Company-level exception: ABB accounts round-robin between ALAA and TAHA
// regardless of which AM owns them, overriding the default partnership.
const ASSIGNMENT_RULES: { matchType: string; matchValue: string; operatorNames: string[]; priority: number; note: string }[] = [
  { matchType: "COMPANY_NAME_CONTAINS", matchValue: "ABB", operatorNames: ["ALAA", "TAHA"], priority: 100, note: "ABB accounts (round-robin)" },
];

async function main() {
  await prisma.requestStatusHistory.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.partnership.deleteMany();
  await prisma.assignmentRule.deleteMany();
  await prisma.deliveryTask.deleteMany();
  await prisma.gatePass.deleteMany();
  await prisma.collector.deleteMany();
  await prisma.company.deleteMany();
  await prisma.employee.deleteMany();

  const companyNames = [...new Set(seedData.map((r) => r.company))];
  const companies = new Map<string, number>();
  for (const name of companyNames) {
    const company = await prisma.company.create({
      data: { name, sector: COMPANY_SECTORS[name] ?? null },
    });
    companies.set(name, company.id);
  }

  const collectorNames = [
    ...new Set(seedData.map((r) => r.collectedBy).filter((v): v is string => Boolean(v))),
  ];
  const collectors = new Map<string, number>();
  for (const name of collectorNames) {
    const collector = await prisma.collector.create({ data: { name } });
    collectors.set(name, collector.id);
  }

  const gatePasses = new Map<string, number>();
  for (const record of seedData) {
    const gatePass = await prisma.gatePass.create({
      data: {
        number: record.number,
        companyId: companies.get(record.company)!,
        location: LOCATION_MAP[record.location],
        gatePassType: gatePassTypeFromLabel(record.gatePassType),
        requestType: requestTypeFromLabel(record.requestType),
        passCategory: passCategoryFromLabel(record.passCategory),
        submittedBy: record.submittedBy,
        submissionAt: new Date(record.submissionAt),
        collectorId: record.collectedBy ? collectors.get(record.collectedBy) : null,
        collectionAt: record.collectionAt ? new Date(record.collectionAt) : null,
        status: statusFromLabel(record.status),
        remarks: record.remarks ?? null,
      },
    });
    gatePasses.set(record.number, gatePass.id);
  }

  const employees = new Map<string, number>();
  for (const e of EMPLOYEES) {
    const employee = await prisma.employee.create({
      data: {
        name: e.name,
        isCEO: e.isCEO ?? false,
        isManager: e.isManager ?? false,
        isOpsAdmin: e.isOpsAdmin ?? false,
        isOnline: e.isOnline ?? false,
        isField: e.isField ?? false,
        isAM: e.isAM ?? false,
        isAMLead: e.isAMLead ?? false,
        passwordHash: e.password ? hashPassword(e.password) : null,
      },
    });
    employees.set(e.name, employee.id);
  }

  // Import the real company -> Account Manager allocation. Companies already
  // seeded from the gate pass data are matched case-insensitively and just
  // get their accountManagerId set; everything else is created fresh.
  const companiesByUpper = new Map<string, number>();
  for (const [name, id] of companies) companiesByUpper.set(name.toUpperCase(), id);

  let importedCompanies = 0;
  let linkedCompanies = 0;
  for (const [amName, companyNames] of Object.entries(companyAllocation) as [string, string[]][]) {
    const amId = employees.get(amName);
    if (!amId) continue;
    for (const companyName of companyNames) {
      const key = companyName.toUpperCase();
      const existingId = companiesByUpper.get(key);
      if (existingId) {
        await prisma.company.update({ where: { id: existingId }, data: { accountManagerId: amId } });
        linkedCompanies++;
      } else {
        const created = await prisma.company.create({ data: { name: companyName, accountManagerId: amId } });
        companies.set(companyName, created.id);
        companiesByUpper.set(key, created.id);
        importedCompanies++;
      }
    }
  }

  for (const p of PARTNERSHIPS) {
    const amId = employees.get(p.amName);
    if (!amId) continue;
    const operatorIds = p.operatorNames.map((n) => employees.get(n)!).join(",");
    await prisma.partnership.create({
      data: { amEmployeeId: amId, operatorIds, flagManager: p.flagManager ?? false, note: p.note ?? null },
    });
  }

  for (const r of ASSIGNMENT_RULES) {
    const operatorIds = r.operatorNames.map((n) => employees.get(n)!).join(",");
    await prisma.assignmentRule.create({
      data: { matchType: r.matchType, matchValue: r.matchValue, operatorIds, priority: r.priority, note: r.note },
    });
  }

  const managerId = employees.get("MED-DARWISH")!;
  const now = new Date("2026-07-07T09:00:00");
  const hours = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);

  const tasks: {
    gatePassNumber?: string;
    companyName?: string;
    title: string;
    description?: string;
    stage: DeliveryStage;
    createdBy: string;
    assignedTo?: string;
    scheduledAt?: Date;
    instructions?: string;
    startedAt?: Date;
    completedAt?: Date;
    blockedReason?: string;
  }[] = [
    // ONLINE — internal team still preparing/validating
    {
      gatePassNumber: "GP-2026-032",
      title: "Prepare renewal file for EY Consulting — Ras Laffan",
      description: "Verify supplementary pass documents before submission.",
      stage: DeliveryStage.ONLINE,
      createdBy: "AHMED",
    },
    {
      gatePassNumber: "GP-2026-031",
      title: "Validate Tenaris Global offshore pass documents",
      stage: DeliveryStage.ONLINE,
      createdBy: "ALAA",
    },

    // DISPATCH — ready, waiting for MED-DARWISH to assign a field agent
    {
      gatePassNumber: "GP-2026-030",
      title: "Submit Doha Towers pass application — Tenaris Investment",
      description: "Documents validated online, ready for government submission.",
      stage: DeliveryStage.DISPATCH,
      createdBy: "TAHA",
    },
    {
      companyName: "Welltec",
      title: "Collect stamped approval letter — Ministry of Interior",
      stage: DeliveryStage.DISPATCH,
      createdBy: "MUJEEB",
    },

    // ASSIGNED — manager has assigned agent + schedule + instructions
    {
      gatePassNumber: "GP-2026-029",
      title: "Deliver collected pass to Tenaris Global — Offshore",
      stage: DeliveryStage.ASSIGNED,
      createdBy: "SAMIM",
      assignedTo: "SALAH",
      scheduledAt: hours(4),
      instructions: "Confirm recipient ID before handover. Get signed receipt.",
    },
    {
      companyName: "EY Consulting",
      title: "Go to Immigration Department for Mesaieed site pass",
      stage: DeliveryStage.ASSIGNED,
      createdBy: "ALAA",
      assignedTo: "ABIN",
      scheduledAt: hours(6),
      instructions: "Bring company CR copy + authorization letter. Counter 4.",
    },

    // IN_PROGRESS — field agent has started
    {
      companyName: "Tenaris Investment",
      title: "Renewal submission — Dukhan government office",
      stage: DeliveryStage.IN_PROGRESS,
      createdBy: "TAHA",
      assignedTo: "MED-HUSSAIN",
      scheduledAt: hours(-1),
      instructions: "Standard renewal protocol, queue at counter 2.",
      startedAt: hours(-1),
    },
    {
      companyName: "Welltec",
      title: "Lost pass police report follow-up — Ras Laffan",
      stage: DeliveryStage.IN_PROGRESS,
      createdBy: "SAMIM",
      assignedTo: "AITA",
      scheduledAt: hours(-2),
      instructions: "Collect police report copy, then proceed to gate office.",
      startedAt: hours(-2),
    },

    // BLOCKED — agent reported an issue
    {
      companyName: "Tenaris Global",
      title: "Supplementary pass pickup — Mesaieed",
      stage: DeliveryStage.BLOCKED,
      createdBy: "MUJEEB",
      assignedTo: "MED-HUSSAIN",
      scheduledAt: hours(-4),
      instructions: "Standard pickup, bring authorization letter.",
      startedAt: hours(-4),
      blockedReason: "Office closed for maintenance — need a rescheduled slot from the ministry.",
    },

    // COMPLETED — delivery history
    {
      gatePassNumber: "GP-2026-028",
      title: "Deliver collected pass to Tenaris Global HQ",
      stage: DeliveryStage.COMPLETED,
      createdBy: "ALAA",
      assignedTo: "SALAH",
      scheduledAt: hours(-30),
      instructions: "Front desk handover, get signature.",
      startedAt: hours(-30),
      completedAt: hours(-28),
    },
    {
      gatePassNumber: "GP-2026-025",
      title: "Collect renewed pass — QTerminals gate office",
      stage: DeliveryStage.COMPLETED,
      createdBy: "TAHA",
      assignedTo: "AITA",
      scheduledAt: hours(-52),
      instructions: "Verify pass validity dates before leaving counter.",
      startedAt: hours(-52),
      completedAt: hours(-50),
    },
    {
      companyName: "EY Consulting",
      title: "Submit visitor pass request — Doha Towers reception",
      stage: DeliveryStage.COMPLETED,
      createdBy: "AHMED",
      assignedTo: "ABIN",
      scheduledAt: hours(-76),
      instructions: "Drop off at reception, request tracking number.",
      startedAt: hours(-76),
      completedAt: hours(-75),
    },
  ];

  for (const t of tasks) {
    await prisma.deliveryTask.create({
      data: {
        gatePassId: t.gatePassNumber ? gatePasses.get(t.gatePassNumber) : null,
        companyId: t.companyName ? companies.get(t.companyName) : null,
        title: t.title,
        description: t.description ?? null,
        stage: t.stage,
        createdById: employees.get(t.createdBy) ?? null,
        assignedToId: t.assignedTo ? employees.get(t.assignedTo) : null,
        assignedById: t.assignedTo ? managerId : null,
        scheduledAt: t.scheduledAt ?? null,
        instructions: t.instructions ?? null,
        startedAt: t.startedAt ?? null,
        completedAt: t.completedAt ?? null,
        blockedReason: t.blockedReason ?? null,
      },
    });
  }

  // AM -> Online Operations intake requests (separate front-door pipeline
  // that feeds into the existing DeliveryTask/dispatch board once validated).
  const requests: {
    title: string;
    category: RequestCategory;
    companyName?: string;
    clientName?: string;
    description?: string;
    attachments?: string;
    createdBy: string;
    createdAt: Date;
    claimedBy?: string;
    claimedAt?: Date;
    status: RequestStatus;
    readyAt?: Date;
    returnComment?: string;
    returnedAt?: Date;
  }[] = [
    {
      title: "Trade licence renewal",
      category: RequestCategory.PRO,
      companyName: "EY Consulting",
      clientName: "Ahmed Al-Sayed",
      description: "Annual trade licence renewal, client documents attached.",
      attachments: "trade_licence_2025.pdf, passport_copy.pdf",
      createdBy: "Violetta",
      createdAt: hours(-3),
      status: RequestStatus.ASSIGNED_TO_ONLINE,
    },
    {
      title: "Work visa application — new hire",
      category: RequestCategory.PRO,
      companyName: "Welltec",
      clientName: "Jesper Holm",
      description: "New hire work visa, needs sponsorship letter drafted.",
      attachments: "passport_scan.pdf, offer_letter.pdf",
      createdBy: "Abegail",
      createdAt: hours(-2),
      status: RequestStatus.ASSIGNED_TO_ONLINE,
    },
    {
      title: "Deliver stamped contract to client office",
      category: RequestCategory.DELIVERY,
      companyName: "Tenaris Global",
      clientName: "Marco Ferraro",
      description: "Signed contract needs to be physically delivered and countersigned.",
      attachments: "signed_contract.pdf",
      createdBy: "Vongai",
      createdAt: hours(-8),
      claimedBy: "SAMIM",
      claimedAt: hours(-1),
      status: RequestStatus.ONLINE_PROCESSING,
    },
    {
      title: "Company registration document pickup",
      category: RequestCategory.DELIVERY,
      companyName: "Tenaris Investment",
      clientName: "Sara Al-Kuwari",
      description: "Collect the stamped registration certificate from the ministry.",
      attachments: "authorization_letter.pdf",
      createdBy: "Nasma",
      createdAt: hours(-20),
      claimedBy: "TAHA",
      claimedAt: hours(-15),
      status: RequestStatus.PENDING_DISPATCH,
      readyAt: hours(-12),
    },
    {
      title: "Visa renewal — missing Emirates ID copy",
      category: RequestCategory.PRO,
      companyName: "Welltec",
      clientName: "Jesper Holm",
      description: "Visa renewal for existing employee.",
      attachments: "passport_scan.pdf",
      createdBy: "Roxana",
      createdAt: hours(-30),
      claimedBy: "MUJEEB",
      claimedAt: hours(-26),
      status: RequestStatus.MISSING_INFO_RETURNED_TO_AM,
      returnComment: "Missing a clear scan of the Emirates ID (back side). Please re-upload and resubmit.",
      returnedAt: hours(-24),
    },
  ];

  let requestCount = 0;
  for (const r of requests) {
    let deliveryTaskId: number | null = null;
    if (r.status === RequestStatus.PENDING_DISPATCH) {
      const dt = await prisma.deliveryTask.create({
        data: {
          companyId: r.companyName ? companies.get(r.companyName) : null,
          title: r.title,
          description: r.description ?? null,
          stage: DeliveryStage.DISPATCH,
          createdById: r.claimedBy ? employees.get(r.claimedBy) : null,
        },
      });
      deliveryTaskId = dt.id;
    }

    const request = await prisma.serviceRequest.create({
      data: {
        title: r.title,
        category: r.category,
        companyId: r.companyName ? companies.get(r.companyName) : null,
        clientName: r.clientName ?? null,
        description: r.description ?? null,
        attachments: r.attachments ?? null,
        status: r.status,
        createdById: employees.get(r.createdBy)!,
        createdAt: r.createdAt,
        claimedById: r.claimedBy ? employees.get(r.claimedBy) : null,
        claimedAt: r.claimedAt ?? null,
        returnComment: r.returnComment ?? null,
        deliveryTaskId,
      },
    });

    const history: { fromStatus: RequestStatus | null; toStatus: RequestStatus; changedBy?: string; comment?: string; createdAt: Date }[] = [
      { fromStatus: null, toStatus: RequestStatus.ASSIGNED_TO_ONLINE, changedBy: r.createdBy, createdAt: r.createdAt },
    ];
    if (r.claimedBy) {
      history.push({
        fromStatus: RequestStatus.ASSIGNED_TO_ONLINE,
        toStatus: RequestStatus.ONLINE_PROCESSING,
        changedBy: r.claimedBy,
        createdAt: r.claimedAt!,
      });
    }
    if (r.status === RequestStatus.PENDING_DISPATCH) {
      history.push({
        fromStatus: RequestStatus.ONLINE_PROCESSING,
        toStatus: RequestStatus.PENDING_DISPATCH,
        changedBy: r.claimedBy,
        createdAt: r.readyAt!,
      });
    }
    if (r.status === RequestStatus.MISSING_INFO_RETURNED_TO_AM) {
      history.push({
        fromStatus: RequestStatus.ONLINE_PROCESSING,
        toStatus: RequestStatus.MISSING_INFO_RETURNED_TO_AM,
        changedBy: r.claimedBy,
        comment: r.returnComment,
        createdAt: r.returnedAt!,
      });
    }
    for (const h of history) {
      await prisma.requestStatusHistory.create({
        data: {
          requestId: request.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          changedById: h.changedBy ? employees.get(h.changedBy) : null,
          comment: h.comment ?? null,
          createdAt: h.createdAt,
        },
      });
    }
    requestCount++;
  }

  console.log(
    `Seeded ${companies.size} companies (${importedCompanies} imported, ${linkedCompanies} linked to an existing company), ${collectors.size} collectors, ${seedData.length} gate passes, ${employees.size} employees, ${tasks.length} delivery tasks, ${requestCount} service requests.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
