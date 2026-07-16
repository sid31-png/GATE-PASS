"use client";

import { useEffect, useState } from "react";
import { EmployeeDTO, ServiceRequestDTO } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/service-requests";
import { Badge, Card, KpiCard, SectionHeader } from "@/components/ui";

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

export function OnlineQueueBoard({
  initialRequests,
  onlineEmployees,
}: {
  initialRequests: ServiceRequestDTO[];
  onlineEmployees: EmployeeDTO[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [operator, setOperator] = useState("");
  const [returning, setReturning] = useState<ServiceRequestDTO | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rch-online-operator");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage on mount only
      if (saved) setOperator(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function selectOperator(name: string) {
    setOperator(name);
    try { window.localStorage.setItem("rch-online-operator", name); } catch { /* ignore */ }
  }

  async function refresh() {
    const res = await fetch("/api/service-requests?statuses=ASSIGNED_TO_ONLINE,ONLINE_PROCESSING", { cache: "no-store" });
    setRequests(await res.json());
  }

  const operatorEmp = onlineEmployees.find((e) => e.name === operator);

  async function claim(r: ServiceRequestDTO) {
    if (!operatorEmp) {
      alert('Select "I am…" first so the request can be assigned to you.');
      return;
    }
    await fetch(`/api/service-requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ONLINE_PROCESSING", claimedById: operatorEmp.id }),
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

  const incoming = requests.filter((r) => r.status === "ASSIGNED_TO_ONLINE");
  const mine = requests.filter(
    (r) => r.status === "ONLINE_PROCESSING" && (!operatorEmp || r.claimedBy?.id === operatorEmp.id)
  );

  const kpis = { incoming: incoming.length, processing: requests.filter((r) => r.status === "ONLINE_PROCESSING").length };

  return (
    <div>
      <SectionHeader
        title="📥 Online Queue — Account Manager requests"
        subtitle="Take incoming requests, verify documents, then send to Dispatch or return to the AM"
      />

      <Card className="mb-6 max-w-md">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          I am…
        </label>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={operator}
          onChange={(e) => selectOperator(e.target.value)}
        >
          <option value="">Select operator…</option>
          {onlineEmployees.map((e) => (
            <option key={e.id} value={e.name}>{e.name}</option>
          ))}
        </select>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <KpiCard label="Incoming" value={String(kpis.incoming)} accent="slate" />
        <KpiCard label="Being Processed" value={String(kpis.processing)} accent="amber" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        📨 Incoming — assigned to Online
      </h2>
      <div className="mb-6 space-y-3">
        {incoming.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">{r.title}</span>
                <Badge>{STATUS_LABEL[r.status]}</Badge>
              </div>
              {r.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.description}</p>}
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {r.company?.name && <span>{r.company.name}</span>}
                {r.clientName && <span> · {r.clientName}</span>}
                <span> · requested by {r.createdBy.name}</span>
                <span> · {fmt(r.createdAt)}</span>
              </div>
              {r.attachments && (
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">📎 {r.attachments}</div>
              )}
            </div>
            <button
              onClick={() => claim(r)}
              className="shrink-0 rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
            >
              Prendre en charge
            </button>
          </Card>
        ))}
        {incoming.length === 0 && (
          <Card className="text-center text-sm text-slate-400 dark:text-slate-500">Queue is empty.</Card>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        🗂 {operatorEmp ? `My requests — ${operatorEmp.name}` : "In processing"}
      </h2>
      <div className="space-y-3">
        {mine.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">{r.title}</span>
                <Badge>{STATUS_LABEL[r.status]}</Badge>
              </div>
              {r.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.description}</p>}
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {r.company?.name && <span>{r.company.name}</span>}
                {r.clientName && <span> · {r.clientName}</span>}
                <span> · requested by {r.createdBy.name}</span>
                {r.claimedBy && <span> · claimed by {r.claimedBy.name}</span>}
              </div>
              {r.attachments && (
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">📎 {r.attachments}</div>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => readyForDispatch(r)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Prêt pour Dispatch
              </button>
              <button
                onClick={() => setReturning(r)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
              >
                Retourner à l&apos;AM
              </button>
            </div>
          </Card>
        ))}
        {mine.length === 0 && (
          <Card className="text-center text-sm text-slate-400 dark:text-slate-500">
            {operatorEmp ? "Nothing in progress for you right now." : "Nothing in processing right now."}
          </Card>
        )}
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
