"use client";

import { useState } from "react";
import { EmployeeDTO, ServiceRequestDTO } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/service-requests";
import { Badge, Card, KpiCard, SectionHeader } from "@/components/ui";
import { useCurrentUser } from "@/lib/current-user";

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReturnModal({
  request,
  onClose,
  onSaved,
}: {
  request: ServiceRequestDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    await fetch(`/api/service-requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "MISSING_INFO_RETURNED_TO_AM", returnComment: comment }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Return to Account Manager</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{request.title} · requested by {request.createdBy.name}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            required
            autoFocus
            rows={3}
            placeholder="e.g. Missing a clear scan of the Emirates ID (back side)…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Sending…" : "Return to AM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestCard({
  r,
  viewAll,
  onlineEmployees,
  onStart,
  onReady,
  onReturn,
  onReassign,
}: {
  r: ServiceRequestDTO;
  viewAll: boolean;
  onlineEmployees: EmployeeDTO[];
  onStart?: (r: ServiceRequestDTO) => void;
  onReady?: (r: ServiceRequestDTO) => void;
  onReturn?: (r: ServiceRequestDTO) => void;
  onReassign: (r: ServiceRequestDTO, operatorId: number) => void;
}) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">{r.title}</span>
          <Badge>{STATUS_LABEL[r.status]}</Badge>
          {r.flaggedForManager && (
            <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20">
              🚩 Flagged for MED-DARWISH
            </span>
          )}
        </div>
        {r.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.description}</p>}
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {r.company?.name && <span>{r.company.name}</span>}
          {r.clientName && <span> · {r.clientName}</span>}
          <span> · requested by {r.createdBy.name}</span>
          <span> · {fmt(r.createdAt)}</span>
        </div>
        {r.attachments && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">📎 {r.attachments}</div>}
        {r.assignmentNote && (
          <div className="mt-1 text-[11px] italic text-slate-400 dark:text-slate-500">{r.assignmentNote}</div>
        )}
        {viewAll && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Assigned to:</span>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={r.claimedBy?.id ?? ""}
              onChange={(e) => e.target.value && onReassign(r, Number(e.target.value))}
            >
              <option value="">Unassigned</option>
              {onlineEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {onStart && (
          <button onClick={() => onStart(r)} className="rounded-lg bg-[#af1882] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8f1468]">
            Start processing
          </button>
        )}
        {onReady && (
          <button onClick={() => onReady(r)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
            Prêt pour Dispatch
          </button>
        )}
        {onReturn && (
          <button
            onClick={() => onReturn(r)}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
          >
            Retourner à l&apos;AM
          </button>
        )}
      </div>
    </Card>
  );
}

export function OnlineQueueBoard({
  initialRequests,
  onlineEmployees,
}: {
  initialRequests: ServiceRequestDTO[];
  onlineEmployees: EmployeeDTO[];
}) {
  const { currentEmployee, can } = useCurrentUser();
  const [requests, setRequests] = useState(initialRequests);
  const [returning, setReturning] = useState<ServiceRequestDTO | null>(null);

  const viewAll = can("view_all_online_queue");

  async function refresh() {
    const res = await fetch("/api/service-requests?statuses=ASSIGNED_TO_ONLINE,ONLINE_PROCESSING", { cache: "no-store" });
    setRequests(await res.json());
  }

  async function start(r: ServiceRequestDTO) {
    await fetch(`/api/service-requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ONLINE_PROCESSING" }),
    });
    await refresh();
  }

  async function readyForDispatch(r: ServiceRequestDTO) {
    await fetch(`/api/service-requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING_DISPATCH" }),
    });
    await refresh();
  }

  async function reassign(r: ServiceRequestDTO, operatorId: number) {
    await fetch(`/api/service-requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimedById: operatorId,
        changedById: currentEmployee?.id ?? null,
        assignmentNote: `Manually reassigned by ${currentEmployee?.name ?? "an administrator"}.`,
      }),
    });
    await refresh();
  }

  const visible = viewAll
    ? requests
    : requests.filter((r) => currentEmployee && r.claimedBy?.id === currentEmployee.id);

  const toStart = visible.filter((r) => r.status === "ASSIGNED_TO_ONLINE");
  const inProgress = visible.filter((r) => r.status === "ONLINE_PROCESSING");

  const kpis = {
    toStart: toStart.length,
    processing: inProgress.length,
    flagged: visible.filter((r) => r.flaggedForManager).length,
  };

  if (!viewAll && !currentEmployee) {
    return (
      <div>
        <SectionHeader title="📥 Online Queue" subtitle="Take incoming requests, verify documents, then send to Dispatch" />
        <Card className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          Select your account in the sidebar (“Signed in as”) to see the requests auto-assigned to you.
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="📥 Online Queue — Account Manager requests"
        subtitle={
          viewAll
            ? "Full queue — every Online Operator's auto-assigned requests"
            : `Requests auto-assigned to ${currentEmployee?.name} via the binome routing`
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KpiCard label="To Start" value={String(kpis.toStart)} accent="slate" />
        <KpiCard label="In Progress" value={String(kpis.processing)} accent="amber" />
        <KpiCard label="Flagged for Manager" value={String(kpis.flagged)} accent="red" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">📨 To start</h2>
      <div className="mb-6 space-y-3">
        {toStart.map((r) => (
          <RequestCard key={r.id} r={r} viewAll={viewAll} onlineEmployees={onlineEmployees} onStart={start} onReassign={reassign} />
        ))}
        {toStart.length === 0 && <Card className="text-center text-sm text-slate-400 dark:text-slate-500">Nothing waiting to start.</Card>}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">🗂 In progress</h2>
      <div className="space-y-3">
        {inProgress.map((r) => (
          <RequestCard
            key={r.id}
            r={r}
            viewAll={viewAll}
            onlineEmployees={onlineEmployees}
            onReady={readyForDispatch}
            onReturn={() => setReturning(r)}
            onReassign={reassign}
          />
        ))}
        {inProgress.length === 0 && <Card className="text-center text-sm text-slate-400 dark:text-slate-500">Nothing in progress.</Card>}
      </div>

      {returning && (
        <ReturnModal
          request={returning}
          onClose={() => setReturning(null)}
          onSaved={async () => {
            setReturning(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
