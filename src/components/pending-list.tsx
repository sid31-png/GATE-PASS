"use client";

import { useState } from "react";
import { CompanyDTO, CollectorDTO, GatePassDTO, LOCATION_LABEL } from "@/lib/types";
import { daysWaiting, priority } from "@/lib/gatepass";
import { Badge, Card, KpiCard, SectionHeader } from "@/components/ui";
import { GatePassForm } from "@/components/gate-pass-form";

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PendingList({
  initialPending,
  companies,
  collectors,
}: {
  initialPending: GatePassDTO[];
  companies: CompanyDTO[];
  collectors: CollectorDTO[];
}) {
  const [pending, setPending] = useState(initialPending);
  const [editing, setEditing] = useState<GatePassDTO | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  async function refresh() {
    const res = await fetch("/api/gate-passes?status=PENDING", { cache: "no-store" });
    setPending(await res.json());
  }

  async function handleCancel(id: number) {
    const remarks = prompt("Reason for cancellation (optional):") ?? undefined;
    await fetch(`/api/gate-passes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", remarks }),
    });
    await refresh();
  }

  const rows = pending
    .map((gp) => ({
      gp,
      days: daysWaiting({ submissionAt: new Date(gp.submissionAt) }),
      prio: priority({ submissionAt: new Date(gp.submissionAt) }),
    }))
    .sort((a, b) => b.days - a.days);

  const overdue = rows.filter((r) => r.days > 2).length;

  return (
    <div>
      <SectionHeader
        title="⏳ Pending Gate Passes"
        subtitle="Sorted by longest waiting time first"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-2">
        <KpiCard label="Total Pending" value={String(pending.length)} accent="amber" />
        <KpiCard label="Overdue (>48h)" value={String(overdue)} accent="red" />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Gate Pass #</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Submission</th>
              <th className="px-4 py-3">Days Waiting</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ gp, days, prio }) => (
              <tr key={gp.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{gp.number}</td>
                <td className="px-4 py-3">{gp.company.name}</td>
                <td className="px-4 py-3">{LOCATION_LABEL[gp.location]}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmt(gp.submissionAt)}</td>
                <td className="px-4 py-3">{days.toFixed(1)}</td>
                <td className="px-4 py-3">
                  <Badge>{prio}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditing(gp);
                        setFormOpen(true);
                      }}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      Mark Collected
                    </button>
                    <button
                      onClick={() => handleCancel(gp.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No pending gate passes. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {formOpen && editing && (
        <GatePassForm
          companies={companies}
          collectors={collectors}
          initial={{ ...editing, status: "COLLECTED" }}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
