import { prisma } from "@/lib/prisma";
import { FieldTeamBoard } from "@/components/field-team-board";
import { DeliveryTaskDTO, EmployeeDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const includeRelations = {
  gatePass: { select: { id: true, number: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

export default async function FieldPage() {
  const [tasks, employees] = await Promise.all([
    prisma.deliveryTask.findMany({
      where: { stage: { in: ["ASSIGNED", "IN_PROGRESS", "BLOCKED"] } },
      include: includeRelations,
      orderBy: [{ scheduledAt: "asc" }],
    }),
    prisma.employee.findMany({ where: { active: true, isField: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <FieldTeamBoard
      initialTasks={JSON.parse(JSON.stringify(tasks)) as DeliveryTaskDTO[]}
      fieldEmployees={JSON.parse(JSON.stringify(employees)) as EmployeeDTO[]}
    />
  );
}
