import { prisma } from "@/lib/prisma";
import { DispatchBoard } from "@/components/dispatch-board";
import { DeliveryTaskDTO, EmployeeDTO } from "@/lib/types";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";

export const dynamic = "force-dynamic";

const includeRelations = {
  gatePass: { select: { id: true, number: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

export default async function DispatchPage() {
  const [tasks, employees] = await Promise.all([
    prisma.deliveryTask.findMany({
      where: { stage: { not: "COMPLETED" } },
      include: includeRelations,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: PUBLIC_EMPLOYEE_SELECT }),
  ]);

  return (
    <DispatchBoard
      initialTasks={JSON.parse(JSON.stringify(tasks)) as DeliveryTaskDTO[]}
      employees={JSON.parse(JSON.stringify(employees)) as EmployeeDTO[]}
    />
  );
}
