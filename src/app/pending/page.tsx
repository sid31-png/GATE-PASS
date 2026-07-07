import { prisma } from "@/lib/prisma";
import { PendingList } from "@/components/pending-list";
import { GatePassDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const [pending, companies, collectors] = await Promise.all([
    prisma.gatePass.findMany({
      where: { status: "PENDING" },
      include: { company: true, collector: true },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.collector.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <PendingList
      initialPending={JSON.parse(JSON.stringify(pending)) as GatePassDTO[]}
      companies={JSON.parse(JSON.stringify(companies))}
      collectors={JSON.parse(JSON.stringify(collectors))}
    />
  );
}
