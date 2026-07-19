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
  ServiceRequestDTO,
} from "@/lib/types";

type GatePassLocationValue = GatePassDTO["location"];
type GatePassTypeValue = GatePassDTO["gatePassType"];
type RequestTypeValue = GatePassDTO["requestType"];
type PassCategoryValue = GatePassDTO["passCategory"];
import { STATUS_LABEL } from "@/lib/service-requests";
import { Badge, Card, KpiCard, SectionHeader } from "@/components/ui";
import { useCurrentUser } from "@/lib/current-user";
import { PRO_SERVICE_CATALOG_NO_GATE_PASS } from "@/lib/pro-services";
import { roleOf } from "@/lib/rbac";

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NewRequestModal({
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

function NewGatePassRequestModal({
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
  const [proFormOpen, setProFormOpen] = useState(false);
  const [gatePassFormOpen, setGatePassFormOpen] = useState(false);
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
            <div className="flex gap-2">
              <button
                onClick={() => setProFormOpen(true)}
                className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
              >
                + PRO Service Request
              </button>
              <button
                onClick={() => setGatePassFormOpen(true)}
                className="rounded-lg border border-[#af1882] px-4 py-2 text-sm font-medium text-[#af1882] hover:bg-[#af1882]/5"
              >
                + Gate Pass Request
              </button>
            </div>
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

      {proFormOpen && can("create_service_request") && (
        <NewRequestModal
          amEmployees={amEmployees}
          companies={companies}
          currentEmployee={currentEmployee}
          onClose={() => setProFormOpen(false)}
          onSaved={async () => {
            setProFormOpen(false);
            await refresh();
          }}
        />
      )}
      {gatePassFormOpen && can("create_service_request") && (
        <NewGatePassRequestModal
          amEmployees={amEmployees}
          companies={companies}
          currentEmployee={currentEmployee}
          onClose={() => setGatePassFormOpen(false)}
          onSaved={async () => {
            setGatePassFormOpen(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
