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
import { Card, KpiCard, SectionHeader, HeroBand, HeroStat } from "@/components/ui";
import {
  SubmittedVsCollectedChart,
  StatusPieChart,
  EvolutionLineChart,
  CollectorBarChart,
} from "@/components/charts";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";
import { PUBLIC_EMPLOYEE_SELECT } from "@/lib/employee-select";
import { CompanyDTO, EmployeeDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [gatePasses, amEmployees, companies] = await Promise.all([
    prisma.gatePass.findMany({ include: { company: true, collector: true } }) as Promise<GatePassWithRelations[]>,
    prisma.employee.findMany({ where: { active: true, isAM: true }, orderBy: { name: "asc" }, select: PUBLIC_EMPLOYEE_SELECT }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const kpis = computeKpis(gatePasses, now);
  const statusDist = computeStatusDistribution(gatePasses);
  const daily = computeDailySeries(gatePasses, 14, now);
  const weekly = computeWeeklySeries(gatePasses, 8, now);
  const monthly = computeMonthlySeries(gatePasses, 12, now);
  const collectorPerf = computeCollectorPerformance(gatePasses);

  return (
    <div>
      <SectionHeader
        title="🛂 Gate Pass Dashboard"
        subtitle="Submission & collection tracking · updates automatically"
        action={
          <DashboardQuickActions
            amEmployees={JSON.parse(JSON.stringify(amEmployees)) as EmployeeDTO[]}
            companies={JSON.parse(JSON.stringify(companies)) as CompanyDTO[]}
          />
        }
      />

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
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Submitted vs Collected</h2>
          <SubmittedVsCollectedChart
            data={[
              { label: "Submitted", value: kpis.total },
              { label: "Collected", value: kpis.collected },
            ]}
          />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Status Breakdown</h2>
          <StatusPieChart data={statusDist} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Daily Trend (14 Days)</h2>
          <EvolutionLineChart data={daily} xKey="date" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Weekly Trend (8 Weeks)</h2>
          <EvolutionLineChart data={weekly} xKey="weekOf" />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Monthly Trend</h2>
          <EvolutionLineChart data={monthly} xKey="month" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Collector Performance</h2>
          <CollectorBarChart data={collectorPerf} />
        </Card>
      </div>
    </div>
  );
}
