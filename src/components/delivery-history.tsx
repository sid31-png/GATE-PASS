"use client";

import { useMemo, useState } from "react";
import { DeliveryTaskDTO } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/delivery";
import { Badge, Card, KpiCard, SectionHeader } from "@/components/ui";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
function fmtTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function duration(startIso: string | null, endIso: string | null) {
  if (!startIso || !endIso) return "—";
  const hours = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 36e5;
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)} h`;
}

export function DeliveryHistory({ tasks }: { tasks: DeliveryTaskDTO[] }) {
  const [filter, setFilter] = useState<"ALL" | "COMPLETED" | "BLOCKED">("ALL");

  const completed = tasks.filter((t) => t.stage === "COMPLETED");
  const blocked = tasks.filter((t) => t.stage === "BLOCKED");

  const avgHours = useMemo(() => {
    const durations = completed
      .filter((t) => t.startedAt && t.completedAt)
      .map((t) => (new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime()) / 36e5);
    if (durations.length === 0) return null;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }, [completed]);

  const rows = tasks.filter((t) => (filter === "ALL" ? true : t.stage === filter));

  return (
    <div>
      <SectionHeader title="📦 Delivery Tracking" subtitle="History of completed and blocked missions" />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KpiCard label="Completed" value={String(completed.length)} accent="green" />
        <KpiCard label="Currently Blocked" value={String(blocked.length)} accent="red" />
        <KpiCard
          label="Avg. Turnaround"
          value={avgHours !== null ? `${avgHours.toFixed(1)} h` : "—"}
          sub="from start to completion"
          accent="brand"
        />
      </div>

      <div className="mb-4 flex gap-2">
        {(["ALL", "COMPLETED", "BLOCKED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === f
                ? "bg-[#af1882] text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {f === "ALL" ? "All" : STAGE_LABEL[f]}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Company / Gate Pass</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((t) => {
              const finalAt = t.completedAt ?? t.createdAt;
              return (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {t.company?.name ?? "—"}
                    {t.gatePass?.number && <span> · {t.gatePass.number}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.assignedTo?.name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {fmtDate(finalAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {fmtTime(finalAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {duration(t.startedAt, t.completedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{STAGE_LABEL[t.stage]}</Badge>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                  No delivery history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
