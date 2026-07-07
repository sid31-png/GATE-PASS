"use client";

import { useMemo, useState } from "react";
import {
  CompanyDTO,
  CollectorDTO,
  GatePassDTO,
  LOCATIONS,
  LOCATION_LABEL,
  GATE_PASS_TYPE_LABEL,
  REQUEST_TYPE_LABEL,
  PASS_CATEGORY_LABEL,
} from "@/lib/types";
import { delayCategory, processingHours, formatDuration } from "@/lib/gatepass";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { GatePassForm } from "@/components/gate-pass-form";

function toDated(gp: GatePassDTO) {
  return {
    ...gp,
    submissionAt: new Date(gp.submissionAt),
    collectionAt: gp.collectionAt ? new Date(gp.collectionAt) : null,
  };
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GatePassTracker({
  initialGatePasses,
  companies,
  collectors,
}: {
  initialGatePasses: GatePassDTO[];
  companies: CompanyDTO[];
  collectors: CollectorDTO[];
}) {
  const [gatePasses, setGatePasses] = useState(initialGatePasses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [collectorFilter, setCollectorFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GatePassDTO | undefined>(undefined);

  async function refresh() {
    const res = await fetch("/api/gate-passes", { cache: "no-store" });
    setGatePasses(await res.json());
  }

  const filtered = useMemo(() => {
    return gatePasses.filter((gp) => {
      if (statusFilter && gp.status !== statusFilter) return false;
      if (companyFilter && String(gp.company.id) !== companyFilter) return false;
      if (collectorFilter && String(gp.collector?.id ?? "") !== collectorFilter) return false;
      if (locationFilter && gp.location !== locationFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${gp.number} ${gp.company.name} ${gp.submittedBy}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [gatePasses, search, statusFilter, companyFilter, collectorFilter, locationFilter]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this gate pass? This cannot be undone.")) return;
    await fetch(`/api/gate-passes/${id}`, { method: "DELETE" });
    await refresh();
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

  return (
    <div>
      <SectionHeader
        title="📋 Gate Pass Tracker"
        subtitle={`${filtered.length} of ${gatePasses.length} gate passes`}
        action={
          <button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
            className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
          >
            + New Gate Pass
          </button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search number, company, submitter…"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COLLECTED">Collected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={collectorFilter}
            onChange={(e) => setCollectorFilter(e.target.value)}
          >
            <option value="">All collectors</option>
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[1300px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Gate Pass #</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Gate Pass Type</th>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Submission</th>
              <th className="px-4 py-3">Collector</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delay</th>
              <th className="px-4 py-3">Processing</th>
              <th className="px-4 py-3">Remarks</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((gp) => {
              const dated = toDated(gp);
              const hours = processingHours(dated);
              return (
                <tr key={gp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{gp.number}</td>
                  <td className="px-4 py-3">{gp.company.name}</td>
                  <td className="px-4 py-3">{LOCATION_LABEL[gp.location]}</td>
                  <td className="px-4 py-3">{GATE_PASS_TYPE_LABEL[gp.gatePassType]}</td>
                  <td className="px-4 py-3">{REQUEST_TYPE_LABEL[gp.requestType]}</td>
                  <td className="px-4 py-3">{PASS_CATEGORY_LABEL[gp.passCategory]}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(gp.submissionAt)}</td>
                  <td className="px-4 py-3">{gp.collector?.name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(gp.collectionAt)}</td>
                  <td className="px-4 py-3">
                    <Badge>{gp.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{delayCategory(dated)}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{hours !== null ? formatDuration(hours) : "—"}</td>
                  <td className="px-4 py-3 max-w-[160px] truncate text-slate-500">{gp.remarks ?? ""}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditing(gp);
                          setFormOpen(true);
                        }}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      {gp.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(gp.id)}
                          className="text-xs font-medium text-amber-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(gp.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-slate-400">
                  No gate passes match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {formOpen && (
        <GatePassForm
          companies={companies}
          collectors={collectors}
          initial={editing}
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
