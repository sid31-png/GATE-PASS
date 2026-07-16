import {
  PrismaClient,
  GatePassStatus,
  GatePassType,
  RequestType,
  PassCategory,
  Location,
  DeliveryStage,
} from "../src/generated/prisma/client";
import seedData from "./data/gatepass_seed.json";

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

// The real delivery/dispatch team roster.
const EMPLOYEES: {
  name: string;
  isManager?: boolean;
  isOnline?: boolean;
  isField?: boolean;
}[] = [
  { name: "MED-DARWISH", isManager: true },
  { name: "ALAA", isOnline: true, isField: true },
  { name: "AHMED", isOnline: true },
  { name: "SAMIM", isOnline: true, isField: true },
  { name: "TAHA", isOnline: true, isField: true },
  { name: "MUJEEB", isOnline: true, isField: true },
  { name: "SALAH", isField: true },
  { name: "MED-HUSSAIN", isField: true },
  { name: "ABIN", isField: true },
  { name: "AITA", isField: true },
];

async function main() {
  await prisma.deliveryTask.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.gatePass.deleteMany();
  await prisma.collector.deleteMany();
  await prisma.company.deleteMany();

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
        isManager: e.isManager ?? false,
        isOnline: e.isOnline ?? false,
        isField: e.isField ?? false,
      },
    });
    employees.set(e.name, employee.id);
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

  console.log(
    `Seeded ${companies.size} companies, ${collectors.size} collectors, ${seedData.length} gate passes, ${employees.size} employees, ${tasks.length} delivery tasks.`
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
