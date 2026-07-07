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
import { Card, KpiCard, SectionHeader } from "@/components/ui";
import {
  SubmittedVsCollectedChart,
  StatusPieChart,
  EvolutionLineChart,
  CollectorBarChart,
} from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const gatePasses = (await prisma.gatePass.findMany({
    include: { company: true, collector: true },
  })) as GatePassWithRelations[];

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
        title="🛂 Gate Pass Management — Tableau de bord"
        subtitle="Suivi des soumissions et collectes • Mise à jour automatique"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total soumis" value={String(kpis.total)} accent="slate" />
        <KpiCard label="Collectés" value={String(kpis.collected)} accent="green" />
        <KpiCard label="En attente" value={String(kpis.pending)} accent="amber" />
        <KpiCard label="Annulés" value={String(kpis.cancelled)} accent="red" />
        <KpiCard
          label="Taux de collecte"
          value={`${(kpis.collectionRate * 100).toFixed(0)}%`}
          accent="blue"
        />
        <KpiCard
          label="Temps moyen"
          value={kpis.avgProcessingHours ? formatDuration(kpis.avgProcessingHours) : "—"}
          accent="blue"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Collecte la + rapide"
          value={kpis.fastestHours !== null ? formatDuration(kpis.fastestHours) : "—"}
          accent="green"
        />
        <KpiCard
          label="Collecte la + longue"
          value={kpis.longestHours !== null ? formatDuration(kpis.longestHours) : "—"}
          accent="red"
        />
        <KpiCard label="Traités aujourd'hui" value={String(kpis.processedToday)} />
        <KpiCard label="Cette semaine" value={String(kpis.processedThisWeek)} />
        <KpiCard label="Ce mois" value={String(kpis.processedThisMonth)} />
        <KpiCard label="Cette année" value={String(kpis.processedThisYear)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Soumis vs Collectés</h2>
          <SubmittedVsCollectedChart
            data={[
              { label: "Soumis", value: kpis.total },
              { label: "Collectés", value: kpis.collected },
            ]}
          />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Répartition des statuts</h2>
          <StatusPieChart data={statusDist} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Évolution quotidienne (14 jours)
          </h2>
          <EvolutionLineChart data={daily} xKey="date" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Évolution hebdomadaire (8 semaines)
          </h2>
          <EvolutionLineChart data={weekly} xKey="weekOf" />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Évolution mensuelle</h2>
          <EvolutionLineChart data={monthly} xKey="month" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Performance par collecteur</h2>
          <CollectorBarChart data={collectorPerf} />
        </Card>
      </div>
    </div>
  );
}
