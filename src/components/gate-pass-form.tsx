"use client";

import { useState } from "react";
import { CompanyDTO, CollectorDTO, GatePassDTO, REQUEST_TYPES } from "@/lib/types";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function GatePassForm({
  companies,
  collectors,
  initial,
  onClose,
  onSaved,
}: {
  companies: CompanyDTO[];
  collectors: CollectorDTO[];
  initial?: GatePassDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial);
  const [companyId, setCompanyId] = useState(initial?.company.id ? String(initial.company.id) : "");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [requestType, setRequestType] = useState(initial?.requestType ?? REQUEST_TYPES[0]);
  const [submittedBy, setSubmittedBy] = useState(initial?.submittedBy ?? "");
  const [submissionAt, setSubmissionAt] = useState(
    toLocalInput(initial?.submissionAt ?? new Date().toISOString())
  );
  const [status, setStatus] = useState(initial?.status ?? "PENDING");
  const [collectorId, setCollectorId] = useState(initial?.collector?.id ? String(initial.collector.id) : "");
  const [collectionAt, setCollectionAt] = useState(toLocalInput(initial?.collectionAt ?? null));
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      requestType,
      submittedBy,
      submissionAt: new Date(submissionAt).toISOString(),
      status,
      collectorId: status === "COLLECTED" && collectorId ? Number(collectorId) : null,
      collectionAt: status === "COLLECTED" && collectionAt ? new Date(collectionAt).toISOString() : null,
      remarks: remarks || null,
    };

    if (companyId) payload.companyId = Number(companyId);
    else if (newCompanyName) payload.companyName = newCompanyName;

    try {
      const url = isEdit ? `/api/gate-passes/${initial!.id}` : "/api/gate-passes";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {isEdit ? `Edit ${initial!.number}` : "New Gate Pass"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">— Select existing —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or type a new company name"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={newCompanyName}
              onChange={(e) => {
                setNewCompanyName(e.target.value);
                if (e.target.value) setCompanyId("");
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Request Type</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
              >
                {REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Submitted By</label>
              <input
                required
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Submission Date & Time</label>
            <input
              required
              type="datetime-local"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={submissionAt}
              onChange={(e) => setSubmissionAt(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="PENDING">Pending</option>
              <option value="COLLECTED">Collected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {status === "COLLECTED" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Collected By</label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={collectorId}
                  onChange={(e) => setCollectorId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {collectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Collection Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={collectionAt}
                  onChange={(e) => setCollectionAt(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create Gate Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
