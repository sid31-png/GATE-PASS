import { prisma } from "@/lib/prisma";
import { DispatchBoard } from "@/components/dispatch-board";
import { DeliveryTaskDTO, EmployeeDTO, GatePassDTO, ServiceRequestDTO } from "@/lib/types";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";

export const dynamic = "force-dynamic";

const includeRelations = {
  gatePass: { select: { id: true, number: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

const serviceRequestInclude = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  claimedBy: { select: { id: true, name: true } },
};

export default async function DispatchPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [tasks, employees, pendingGatePasses, pendingServiceRequests, completedTodayCount] = await Promise.all([
    prisma.deliveryTask.findMany({
      where: { stage: { not: "COMPLETED" } },
      include: includeRelations,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: PUBLIC_EMPLOYEE_SELECT }),
    prisma.gatePass.findMany({
      where: { status: "PENDING" },
      include: { company: { select: { id: true, name: true } }, collector: { select: { id: true, name: true } } },
      orderBy: { submissionAt: "asc" },
    }),
    // Still within the AM -> Online phase — not yet handed off to a DeliveryTask.
    prisma.serviceRequest.findMany({
      where: { status: { in: ["ASSIGNED_TO_ONLINE", "ONLINE_PROCESSING", "MISSING_INFO_RETURNED_TO_AM"] } },
      include: serviceRequestInclude,
      orderBy: { createdAt: "asc" },
    }),
    prisma.deliveryTask.count({ where: { stage: "COMPLETED", completedAt: { gte: startOfToday } } }),
  ]);

  return (
    <DispatchBoard
      initialTasks={JSON.parse(JSON.stringify(tasks)) as DeliveryTaskDTO[]}
      employees={JSON.parse(JSON.stringify(employees)) as EmployeeDTO[]}
      pendingGatePasses={JSON.parse(JSON.stringify(pendingGatePasses)) as GatePassDTO[]}
      pendingServiceRequests={JSON.parse(JSON.stringify(pendingServiceRequests)) as ServiceRequestDTO[]}
      completedTodayCount={completedTodayCount}
    />
  );
}
