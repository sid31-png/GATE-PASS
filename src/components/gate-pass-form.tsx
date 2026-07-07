"use client";

import { useState } from "react";
import {
  CompanyDTO,
  CollectorDTO,
  GatePassDTO,
  LOCATIONS,
  GATE_PASS_TYPES,
  REQUEST_TYPES,
  PASS_CATEGORIES,
} from "@/lib/types";

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
  const [location, setLocation] = useState(initial?.location ?? LOCATIONS[0].value);
  const [gatePassType, setGatePassType] = useState(initial?.gatePassType ?? GATE_PASS_TYPES[0].value);
  const [requestType, setRequestType] = useState(initial?.requestType ?? REQUEST_TYPES[0].value);
  const [passCategory, setPassCategory] = useState(initial?.passCategory ?? PASS_CATEGORIES[0].value);
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
      location,
      gatePassType,
      requestType,
      passCategory,
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
            <label htmlFor="gpCompany" className="mb-1 block text-sm font-medium text-slate-700">Company</label>
            <select
              id="gpCompany"
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
              id="gpNewCompany"
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

          <div>
            <label htmlFor="gpLocation" className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <select
              id="gpLocation"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value as typeof location)}
            >
              {LOCATIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="gpGatePassType" className="mb-1 block text-sm font-medium text-slate-700">
                Gate Pass Type
              </label>
              <select
                id="gpGatePassType"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={gatePassType}
                onChange={(e) => setGatePassType(e.target.value as typeof gatePassType)}
              >
                {GATE_PASS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gpRequestType" className="mb-1 block text-sm font-medium text-slate-700">
                Request Type
              </label>
              <select
                id="gpRequestType"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as typeof requestType)}
              >
                {REQUEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gpPassCategory" className="mb-1 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                id="gpPassCategory"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={passCategory}
                onChange={(e) => setPassCategory(e.target.value as typeof passCategory)}
              >
                {PASS_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="gpSubmittedBy" className="mb-1 block text-sm font-medium text-slate-700">
              Submitted By
            </label>
            <input
              id="gpSubmittedBy"
              required
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="gpSubmissionAt" className="mb-1 block text-sm font-medium text-slate-700">
              Submission Date & Time
            </label>
            <input
              id="gpSubmissionAt"
              required
              type="datetime-local"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={submissionAt}
              onChange={(e) => setSubmissionAt(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="gpStatus" className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              id="gpStatus"
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
                <label htmlFor="gpCollector" className="mb-1 block text-sm font-medium text-slate-700">
                  Collected By
                </label>
                <select
                  id="gpCollector"
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
                <label htmlFor="gpCollectionAt" className="mb-1 block text-sm font-medium text-slate-700">
                  Collection Date & Time
                </label>
                <input
                  id="gpCollectionAt"
                  type="datetime-local"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={collectionAt}
                  onChange={(e) => setCollectionAt(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="gpRemarks" className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
            <textarea
              id="gpRemarks"
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
              className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468] disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create Gate Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
