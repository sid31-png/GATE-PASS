"use client";

import { useState } from "react";
import { CompanyDTO, EmployeeDTO, ServiceRequestDTO } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/service-requests";
import { Badge, Card, KpiCard, SectionHeader } from "@/components/ui";
import { useCurrentUser } from "@/lib/current-user";
import { AMQuickActions } from "@/components/am-quick-actions";

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AMDashboard({
  initialRequests,
  employees,
  companies,
}: {
  initialRequests: ServiceRequestDTO[];
  employees: EmployeeDTO[];
  companies: CompanyDTO[];
}) {
  const { currentEmployee, can } = useCurrentUser();
  const [requests, setRequests] = useState(initialRequests);
  const amEmployees = employees.filter((e) => e.isAM);

  async function refresh() {
    const res = await fetch("/api/service-requests", { cache: "no-store" });
    setRequests(await res.json());
  }

  async function resubmit(r: ServiceRequestDTO) {
    await fetch(`/api/service-requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ASSIGNED_TO_ONLINE", changedById: r.createdBy.id }),
    });
    await refresh();
  }

  const seesAll = can("view_all_am_requests");
  const isPlainAM = Boolean(currentEmployee?.isAM && !currentEmployee?.isAMLead);
  const visible = seesAll
    ? requests
    : isPlainAM
      ? requests.filter((r) => r.createdBy.id === currentEmployee!.id)
      : [];

  const kpiByStatus = (s: string) => visible.filter((r) => r.status === s).length;
  const kpis = {
    total: visible.length,
    assignedToOnline: kpiByStatus("ASSIGNED_TO_ONLINE"),
    onlineProcessing: kpiByStatus("ONLINE_PROCESSING"),
    pendingDispatch: kpiByStatus("PENDING_DISPATCH"),
    missingInfo: kpiByStatus("MISSING_INFO_RETURNED_TO_AM"),
  };

  if (!seesAll && !isPlainAM) {
    return (
      <div>
        <SectionHeader title="🧑‍💼 Account Managers" subtitle="Client service requests" />
        <Card className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          🔒 This account doesn&apos;t have Account Manager access.
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="🧑‍💼 Account Managers"
        subtitle={seesAll ? "Global view — all Account Managers' requests" : `${currentEmployee?.name}'s requests`}
        action={
          can("create_service_request") ? (
            <AMQuickActions
              amEmployees={amEmployees}
              companies={companies}
              currentEmployee={currentEmployee}
              onSaved={refresh}
            />
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Assigned to Online" value={String(kpis.assignedToOnline)} accent="slate" />
        <KpiCard label="Online Processing" value={String(kpis.onlineProcessing)} accent="amber" />
        <KpiCard label="Pending Dispatch" value={String(kpis.pendingDispatch)} accent="green" />
        <KpiCard label="Missing Info" value={String(kpis.missingInfo)} accent="red" />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Company / Client</th>
              {seesAll && <th className="px-4 py-3">Requested by</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{r.title}</span>
                    {r.flaggedForManager && <span title="Flagged for MED-DARWISH">🚩</span>}
                  </div>
                  {r.status === "MISSING_INFO_RETURNED_TO_AM" && r.returnComment && (
                    <div className="mt-1 max-w-xs rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      ⚠ {r.returnComment}
                    </div>
                  )}
                  {r.claimedBy && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {r.status === "ASSIGNED_TO_ONLINE" ? "Auto-assigned to " : "Handled by "}
                      {r.claimedBy.name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {r.category === "PRO" ? "PRO service" : "Delivery"}
                  {r.serviceType && <div className="text-xs text-slate-400 dark:text-slate-500">{r.serviceType}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {r.company?.name ?? "—"}
                  {r.clientName && <div className="text-xs text-slate-400 dark:text-slate-500">{r.clientName}</div>}
                </td>
                {seesAll && (
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.createdBy.name}</td>
                )}
                <td className="px-4 py-3">
                  <Badge>{STATUS_LABEL[r.status]}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">{fmt(r.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === "MISSING_INFO_RETURNED_TO_AM" && (
                    <button
                      onClick={() => resubmit(r)}
                      className="text-xs font-medium text-[#af1882] hover:underline"
                    >
                      Resubmit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={seesAll ? 7 : 6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
