import { prisma } from "@/lib/prisma";
import { computeCollectorPerformance, GatePassWithRelations } from "@/lib/gatepass";
import { CollectorManager } from "@/components/collector-manager";

export const dynamic = "force-dynamic";

export default async function CollectorsPage() {
  const [gatePasses, collectors] = await Promise.all([
    prisma.gatePass.findMany({ include: { company: true, collector: true } }),
    prisma.collector.findMany({
      include: { _count: { select: { gatePasses: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const performance = computeCollectorPerformance(gatePasses as GatePassWithRelations[]);

  return (
    <CollectorManager
      performance={performance}
      initialCollectors={JSON.parse(JSON.stringify(collectors))}
    />
  );
}
