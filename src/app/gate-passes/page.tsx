import { prisma } from "@/lib/prisma";
import { GatePassTracker } from "@/components/gate-pass-tracker";
import { GatePassDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GatePassesPage() {
  const [gatePasses, companies, collectors] = await Promise.all([
    prisma.gatePass.findMany({
      include: { company: true, collector: true },
      orderBy: { submissionAt: "desc" },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.collector.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <GatePassTracker
      initialGatePasses={JSON.parse(JSON.stringify(gatePasses)) as GatePassDTO[]}
      companies={JSON.parse(JSON.stringify(companies))}
      collectors={JSON.parse(JSON.stringify(collectors))}
    />
  );
}
