import { prisma } from "@/lib/prisma";
import {
  computeKpis,
  computeStatusDistribution,
  computeDailySeries,
  computeWeeklySeries,
  computeMonthlySeries,
  computeCollectorPerformance,
  formatDuration,
  GatePassWithRelations,
} from "@/lib/gatepass";
import { Badge, Card, KpiCard, SectionHeader, HeroBand, HeroStat } from "@/components/ui";
import {
  SubmittedVsCollectedChart,
  StatusPieChart,
  EvolutionLineChart,
  CollectorBarChart,
} from "@/components/charts";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";
import { CompanyDTO, EmployeeDTO, ServiceRequestDTO } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/service-requests";
import { GATE_PASS_FAMILY_SERVICE_TYPES } from "@/lib/gate-pass-requests";
import { getSessionEmployee } from "@/lib/session";
import { can, roleOf } from "@/lib/rbac";
import { AMDashboard } from "@/components/am-dashboard";
import { OnlineQueueBoard } from "@/components/online-queue-board";

export const dynamic = "force-dynamic";

const serviceRequestInclude = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  claimedBy: { select: { id: true, name: true } },
};

export default async function DashboardPage() {
  const employee = await getSessionEmployee();
  const role = roleOf(employee ?? undefined);

  // A plain Account Manager's "/" is their own request list — the standalone
  // Account Managers page still exists for the admin tier.
  if (role === "AM") {
    const [requests, employees, companies] = await Promise.all([
      prisma.serviceRequest.findMany({ include: serviceRequestInclude, orderBy: { createdAt: "desc" } }),
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

  // An Online Operator's "/" is their own queue — the standalone Online
  // Queue page still exists for the admin tier.
  if (role === "OPERATOR") {
    const [requests, onlineEmployees] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: { status: { in: ["ASSIGNED_TO_ONLINE", "ONLINE_PROCESSING"] } },
        include: serviceRequestInclude,
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
        onlineEmployees={JSON.parse(JSON.stringify(onlineEmployees)) as EmployeeDTO[]}
      />
    );
  }

  // Admin tier (CEO, Super Admin, Ops Admin, AM Lead): the statistics
  // dashboard, split evenly between Gate Pass and PRO Services — not just
  // a Gate Pass tracker with everything else as an afterthought.
  if (!can(employee, "view_dashboard_stats")) {
    return (
      <div>
        <SectionHeader title="🏠 Dashboard" subtitle="Gate Pass & Delivery CRM" />
        <Card className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          🔒 This account doesn&apos;t have a dashboard view configured.
        </Card>
      </div>
    );
  }

  const [gatePasses, amEmployees, companies, serviceRequests] = await Promise.all([
    prisma.gatePass.findMany({ include: { company: true, collector: true } }) as Promise<GatePassWithRelations[]>,
    prisma.employee.findMany({ where: { active: true, isAM: true }, orderBy: { name: "asc" }, select: PUBLIC_EMPLOYEE_SELECT }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceRequest.findMany({ include: serviceRequestInclude, orderBy: { createdAt: "desc" } }),
  ]);

  const now = new Date();
  const kpis = computeKpis(gatePasses, now);
  const statusDist = computeStatusDistribution(gatePasses);
  const daily = computeDailySeries(gatePasses, 14, now);
  const weekly = computeWeeklySeries(gatePasses, 8, now);
  const monthly = computeMonthlySeries(gatePasses, 12, now);
  const collectorPerf = computeCollectorPerformance(gatePasses);

  const proByStatus = (s: string) => serviceRequests.filter((r) => r.status === s).length;
  const gatePassFamilyCount = serviceRequests.filter(
    (r) => r.serviceType && GATE_PASS_FAMILY_SERVICE_TYPES.includes(r.serviceType)
  ).length;
  const proStats = {
    total: serviceRequests.length,
    assignedToOnline: proByStatus("ASSIGNED_TO_ONLINE"),
    onlineProcessing: proByStatus("ONLINE_PROCESSING"),
    pendingDispatch: proByStatus("PENDING_DISPATCH"),
    missingInfo: proByStatus("MISSING_INFO_RETURNED_TO_AM"),
    gatePassFamily: gatePassFamilyCount,
    proCategory: serviceRequests.filter((r) => r.category === "PRO").length,
    deliveryCategory: serviceRequests.filter((r) => r.category === "DELIVERY").length,
    flagged: serviceRequests.filter((r) => r.flaggedForManager).length,
  };
  const recentRequests = serviceRequests.slice(0, 8);

  return (
    <div>
      <SectionHeader
        title="🏠 Dashboard"
        subtitle="Gate Pass & PRO Services overview · updates automatically"
        action={
          <DashboardQuickActions
            amEmployees={JSON.parse(JSON.stringify(amEmployees)) as EmployeeDTO[]}
            companies={JSON.parse(JSON.stringify(companies)) as CompanyDTO[]}
          />
        }
      />

      {/* ================= Gate Pass Overview ================= */}
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">🛂 Gate Pass Overview</h2>

      <HeroBand>
        <HeroStat label="Total Submitted" value={String(kpis.total)} />
        <HeroStat label="Collected" value={String(kpis.collected)} tone="good" />
        <HeroStat label="Pending" value={String(kpis.pending)} tone="warn" />
        <HeroStat label="Cancelled" value={String(kpis.cancelled)} tone="crit" />
        <HeroStat label="Collection Rate" value={`${(kpis.collectionRate * 100).toFixed(0)}%`} tone="brand" />
        <HeroStat
          label="Avg. Processing Time"
          value={kpis.avgProcessingHours ? formatDuration(kpis.avgProcessingHours) : "—"}
          tone="brand"
        />
      </HeroBand>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Fastest"
          value={kpis.fastestHours !== null ? formatDuration(kpis.fastestHours) : "—"}
          accent="green"
        />
        <KpiCard
          label="Longest"
          value={kpis.longestHours !== null ? formatDuration(kpis.longestHours) : "—"}
          accent="red"
        />
        <KpiCard label="Today" value={String(kpis.processedToday)} />
        <KpiCard label="This Week" value={String(kpis.processedThisWeek)} />
        <KpiCard label="This Month" value={String(kpis.processedThisMonth)} />
        <KpiCard label="This Year" value={String(kpis.processedThisYear)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Submitted vs Collected</h3>
          <SubmittedVsCollectedChart
            data={[
              { label: "Submitted", value: kpis.total },
              { label: "Collected", value: kpis.collected },
            ]}
          />
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Status Breakdown</h3>
          <StatusPieChart data={statusDist} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Daily Trend (14 Days)</h3>
          <EvolutionLineChart data={daily} xKey="date" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Weekly Trend (8 Weeks)</h3>
          <EvolutionLineChart data={weekly} xKey="weekOf" />
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Monthly Trend</h3>
          <EvolutionLineChart data={monthly} xKey="month" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Collector Performance</h3>
          <CollectorBarChart data={collectorPerf} />
        </Card>
      </div>

      {/* ================= PRO Services Overview ================= */}
      <h2 className="mb-3 mt-10 text-sm font-semibold text-slate-700 dark:text-slate-300">📋 PRO Services Overview</h2>

      <HeroBand>
        <HeroStat label="Total Requests" value={String(proStats.total)} />
        <HeroStat label="Assigned to Online" value={String(proStats.assignedToOnline)} />
        <HeroStat label="Online Processing" value={String(proStats.onlineProcessing)} tone="warn" />
        <HeroStat label="Pending Dispatch" value={String(proStats.pendingDispatch)} tone="good" />
        <HeroStat label="Missing Info" value={String(proStats.missingInfo)} tone="crit" />
      </HeroBand>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Gate Pass Family" value={String(proStats.gatePassFamily)} accent="brand" />
        <KpiCard label="PRO Category" value={String(proStats.proCategory)} accent="blue" />
        <KpiCard label="Delivery Category" value={String(proStats.deliveryCategory)} accent="slate" />
        <KpiCard label="Flagged for Manager" value={String(proStats.flagged)} accent="red" />
      </div>

      <div className="mt-4">
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Requested by</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentRequests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{r.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {r.category === "PRO" ? r.serviceType ?? "PRO service" : "Delivery"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.company?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.createdBy.name}</td>
                  <td className="px-4 py-3">
                    <Badge>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                </tr>
              ))}
              {recentRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    No PRO Service or Gate Pass requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
