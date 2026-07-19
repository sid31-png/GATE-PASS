import { prisma } from "@/lib/prisma";
import { OnlineTeamBoard } from "@/components/online-team-board";
import { CompanyDTO, DeliveryTaskDTO, EmployeeDTO, GatePassDTO } from "@/lib/types";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";

export const dynamic = "force-dynamic";

const includeRelations = {
  gatePass: { select: { id: true, number: true } },
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

export default async function OnlinePage() {
  const [tasks, employees, companies, gatePasses] = await Promise.all([
    prisma.deliveryTask.findMany({
      where: { stage: { in: ["ONLINE", "DISPATCH"] } },
      include: includeRelations,
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: PUBLIC_EMPLOYEE_SELECT }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.gatePass.findMany({
      where: { status: "PENDING" },
      include: { company: true, collector: true },
      orderBy: { submissionAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <OnlineTeamBoard
      initialTasks={JSON.parse(JSON.stringify(tasks)) as DeliveryTaskDTO[]}
      employees={JSON.parse(JSON.stringify(employees)) as EmployeeDTO[]}
      companies={JSON.parse(JSON.stringify(companies)) as CompanyDTO[]}
      gatePasses={JSON.parse(JSON.stringify(gatePasses)) as GatePassDTO[]}
    />
  );
}
