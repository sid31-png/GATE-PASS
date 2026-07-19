import { prisma } from "@/lib/prisma";
import { OnlineQueueBoard } from "@/components/online-queue-board";
import { EmployeeDTO, ServiceRequestDTO } from "@/lib/types";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";

export const dynamic = "force-dynamic";

const includeRelations = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  claimedBy: { select: { id: true, name: true } },
};

export default async function OnlineQueuePage() {
  const [requests, employees] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { status: { in: ["ASSIGNED_TO_ONLINE", "ONLINE_PROCESSING"] } },
      include: includeRelations,
      orderBy: { createdAt: "asc" },
    }),
    prisma.employee.findMany({
      where: { active: true, isOnline: true },
      orderBy: { name: "asc" },
      select: PUBLIC_EMPLOYEE_SELECT,
    }),
  ]);

  return (
    <OnlineQueueBoard
      initialRequests={JSON.parse(JSON.stringify(requests)) as ServiceRequestDTO[]}
      onlineEmployees={JSON.parse(JSON.stringify(employees)) as EmployeeDTO[]}
    />
  );
}
