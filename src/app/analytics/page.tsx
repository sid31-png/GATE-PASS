import { prisma } from "@/lib/prisma";
import {
  computePivotByCompanyStatus,
  computePivotByCollector,
  computePivotByLocationStatus,
  GatePassWithRelations,
} from "@/lib/gatepass";
import { Card, SectionHeader } from "@/components/ui";
import { LOCATION_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  CANCELLED: "Cancelled",
  COLLECTED: "Collected",
  PENDING: "Pending",
};

export default async function AnalyticsPage() {
  const gatePasses = (await prisma.gatePass.findMany({
    include: { company: true, collector: true },
  })) as GatePassWithRelations[];

  const byCompany = computePivotByCompanyStatus(gatePasses);
  const byCollector = computePivotByCollector(gatePasses);
  const byLocation = computePivotByLocationStatus(gatePasses);

  return (
    <div>
      <SectionHeader title="📊 Analytics" subtitle="Cross-tab reports" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="overflow-x-auto p-0">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            Gate Passes by Company &amp; Status
          </div>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                {byCompany.statuses.map((s) => (
                  <th key={s} className="px-4 py-3 text-right">
                    {STATUS_LABEL[s]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byCompany.rows.map((row) => (
                <tr key={row.company} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.company}</td>
                  {byCompany.statuses.map((s) => (
                    <td key={s} className="px-4 py-3 text-right">
                      {row.counts[s] || ""}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Grand Total</td>
                {byCompany.statuses.map((s) => (
                  <td key={s} className="px-4 py-3 text-right">
                    {byCompany.grandTotal[s]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">{byCompany.grandTotalAll}</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <Card className="overflow-x-auto p-0">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            Gate Passes by Collector
          </div>
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Row Labels</th>
                <th className="px-4 py-3 text-right">Count of Gate Pass Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byCollector.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Grand Total</td>
                <td className="px-4 py-3 text-right">{gatePasses.length}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="overflow-x-auto p-0">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            Gate Passes by Location &amp; Status
          </div>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Location</th>
                {byLocation.statuses.map((s) => (
                  <th key={s} className="px-4 py-3 text-right">
                    {STATUS_LABEL[s]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byLocation.rows.map((row) => (
                <tr key={row.location} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{LOCATION_LABEL[row.location]}</td>
                  {byLocation.statuses.map((s) => (
                    <td key={s} className="px-4 py-3 text-right">
                      {row.counts[s] || ""}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Grand Total</td>
                {byLocation.statuses.map((s) => (
                  <td key={s} className="px-4 py-3 text-right">
                    {byLocation.grandTotal[s]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">{byLocation.grandTotalAll}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>
    </div>
  );
}
