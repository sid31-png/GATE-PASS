import { prisma } from "@/lib/prisma";
import { AMDashboard } from "@/components/am-dashboard";
import { CompanyDTO, EmployeeDTO, ServiceRequestDTO } from "@/lib/types";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";

export const dynamic = "force-dynamic";

const includeRelations = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  claimedBy: { select: { id: true, name: true } },
};

export default async function AccountManagersPage() {
  const [requests, employees, companies] = await Promise.all([
    prisma.serviceRequest.findMany({ include: includeRelations, orderBy: { createdAt: "desc" } }),
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: PUBLIC_EMPLOYEE_SELECT }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AMDashboard
      initialRequests={JSON.parse(JSON.stringify(requests)) as ServiceRequestDTO[]}
      employees={JSON.parse(JSON.stringify(employees)) as EmployeeDTO[]}
      companies={JSON.parse(JSON.stringify(companies)) as CompanyDTO[]}
    />
  );
}
