import { prisma } from "@/lib/prisma";
import { DeliveryHistory } from "@/components/delivery-history";
import { DeliveryTaskDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const includeRelations = {
  gatePass: { select: { id: true, number: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

export default async function DeliveriesPage() {
  const tasks = await prisma.deliveryTask.findMany({
    where: { stage: { in: ["COMPLETED", "BLOCKED"] } },
    include: includeRelations,
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });

  return <DeliveryHistory tasks={JSON.parse(JSON.stringify(tasks)) as DeliveryTaskDTO[]} />;
}
