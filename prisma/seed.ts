import { PrismaClient, GatePassStatus } from "../src/generated/prisma/client";
import seedData from "./data/gatepass_seed.json";

const prisma = new PrismaClient();

const COMPANY_SECTORS: Record<string, string> = {
  "Qatar Steel": "Manufacturing",
  "Gulf Contracting Co": "Construction",
  "Al Jaber Engineering": "Engineering",
  "Doha Logistics": "Logistics",
  QTerminals: "Ports & Terminals",
  "Milaha Maritime": "Maritime",
  "Ashghal Services": "Public Works",
  QatarEnergy: "Energy",
  Nakilat: "Shipping",
  Ooredoo: "Telecom",
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

async function main() {
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

  for (const record of seedData) {
    await prisma.gatePass.create({
      data: {
        number: record.number,
        companyId: companies.get(record.company)!,
        requestType: record.requestType,
        submittedBy: record.submittedBy,
        submissionAt: new Date(record.submissionAt),
        collectorId: record.collectedBy ? collectors.get(record.collectedBy) : null,
        collectionAt: record.collectionAt ? new Date(record.collectionAt) : null,
        status: statusFromLabel(record.status),
        remarks: record.remarks ?? null,
      },
    });
  }

  console.log(
    `Seeded ${companies.size} companies, ${collectors.size} collectors, ${seedData.length} gate passes.`
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
