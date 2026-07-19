"use client";

import { useState } from "react";
import {
  CompanyDTO,
  EmployeeDTO,
  GatePassDTO,
  GATE_PASS_TYPES,
  LOCATION_LABEL,
  LOCATIONS,
  PASS_CATEGORIES,
  REQUEST_TYPES,
} from "@/lib/types";
import { PRO_SERVICE_CATALOG_NO_GATE_PASS } from "@/lib/pro-services";
import { roleOf } from "@/lib/rbac";

type GatePassLocationValue = GatePassDTO["location"];
type GatePassTypeValue = GatePassDTO["gatePassType"];
type RequestTypeValue = GatePassDTO["requestType"];
type PassCategoryValue = GatePassDTO["passCategory"];

// Shared by the Account Managers page and the Dashboard's quick-actions
// widget — an AM/AM Lead/admin can trigger either of these two request
// flows from wherever they land, not just from a dedicated page.

export function NewRequestModal({
  amEmployees,
  companies,
  currentEmployee,
  onClose,
  onSaved,
}: {
  amEmployees: EmployeeDTO[];
  companies: CompanyDTO[];
  currentEmployee: EmployeeDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  // A plain AM can only file for themselves; AM_LEAD/CEO/SUPER_ADMIN may pick
  // any Account Manager to file on behalf of (server re-checks this too).
  const role = roleOf(currentEmployee ?? undefined);
  const canPickAnyAM = role === "AM_LEAD" || role === "CEO" || role === "SUPER_ADMIN";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"PRO" | "DELIVERY">("PRO");
  const [serviceType, setServiceType] = useState("");
  const [companyId, setCompanyId] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState("");
  const [createdBy, setCreatedBy] = useState<number | "">(
    canPickAnyAM ? "" : currentEmployee?.id ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("A title is required."); return; }
    if (canPickAnyAM && !createdBy) { setError("Please select which Account Manager is filing this request."); return; }
    setSaving(true);
    const res = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        serviceType: category === "PRO" ? serviceType || null : null,
        companyId: companyId || null,
        clientName: clientName || null,
        description: description || null,
        attachments: attachments || null,
        createdById: canPickAnyAM ? createdBy : undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create this request.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">New PRO service request</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Attach the client&apos;s information and documents; it will be routed to the Online Operations queue.
        </p>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g. Licence Renewal, Visa Request…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={category}
                onChange={(e) => setCategory(e.target.value as "PRO" | "DELIVERY")}
              >
                <option value="PRO">PRO service</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Requested by</label>
              {canPickAnyAM ? (
                <select
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Select AM…</option>
                  {amEmployees.filter((e) => !e.isAMLead).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  {currentEmployee?.name ?? "—"} (you)
                </div>
              )}
            </div>
          </div>
          {category === "PRO" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">PRO service type</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="">— Select a service —</option>
                {PRO_SERVICE_CATALOG_NO_GATE_PASS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.services.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">—</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Client name</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Attached documents
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g. passport_copy.pdf, trade_licence.pdf"
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468] disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function NewGatePassRequestModal({
  amEmployees,
  companies,
  currentEmployee,
  onClose,
  onSaved,
}: {
  amEmployees: EmployeeDTO[];
  companies: CompanyDTO[];
  currentEmployee: EmployeeDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const role = roleOf(currentEmployee ?? undefined);
  const canPickAnyAM = role === "AM_LEAD" || role === "CEO" || role === "SUPER_ADMIN";

  const [location, setLocation] = useState<GatePassLocationValue | "">("");
  const [gatePassType, setGatePassType] = useState<GatePassTypeValue | "">("");
  const [requestType, setRequestType] = useState<RequestTypeValue | "">("");
  const [passCategory, setPassCategory] = useState<PassCategoryValue | "">("");
  const [companyId, setCompanyId] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState("");
  const [createdBy, setCreatedBy] = useState<number | "">(canPickAnyAM ? "" : currentEmployee?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!location || !gatePassType || !requestType || !passCategory) {
      setError("Please fill in the site, gate pass type, request type, and pass category.");
      return;
    }
    if (canPickAnyAM && !createdBy) { setError("Please select which Account Manager is filing this request."); return; }
    setSaving(true);
    const serviceType = gatePassType === "PERMANENT" ? "Permanent Gate Pass" : "Temporary Gate Pass";
    const title = `${requestType === "LOST" ? "Lost" : "New"} ${serviceType} — ${LOCATION_LABEL[location]}`;
    const res = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category: "PRO",
        serviceType,
        location,
        gatePassType,
        requestType,
        passCategory,
        companyId: companyId || null,
        clientName: clientName || null,
        description: description || null,
        attachments: attachments || null,
        createdById: canPickAnyAM ? createdBy : undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create this request.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">New Gate Pass request</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Site access request — it will be routed to the Online Operations queue.
        </p>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Site / Location</label>
              <select
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={location}
                onChange={(e) => setLocation(e.target.value as GatePassLocationValue)}
              >
                <option value="">Select site…</option>
                {LOCATIONS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Requested by</label>
              {canPickAnyAM ? (
                <select
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Select AM…</option>
                  {amEmployees.filter((e) => !e.isAMLead).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  {currentEmployee?.name ?? "—"} (you)
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Gate pass type</label>
              <select
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={gatePassType}
                onChange={(e) => setGatePassType(e.target.value as GatePassTypeValue)}
              >
                <option value="">—</option>
                {GATE_PASS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Request type</label>
              <select
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as RequestTypeValue)}
              >
                <option value="">—</option>
                {REQUEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pass category</label>
              <select
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={passCategory}
                onChange={(e) => setPassCategory(e.target.value as PassCategoryValue)}
              >
                <option value="">—</option>
                {PASS_CATEGORIES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">—</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Client name</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Attached documents
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g. passport_copy.pdf, authorization_letter.pdf"
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468] disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
