"use client";

import { useState } from "react";
import { CollectorDTO } from "@/lib/types";
import { formatDuration } from "@/lib/gatepass";
import { Badge, Card, SectionHeader } from "@/components/ui";

type PerfRow = {
  name: string;
  totalCollected: number;
  avgHours: number;
  fastestHours: number;
  longestHours: number;
  shareOfCollections: number;
  rank: number;
};

function CollectorFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: CollectorDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = isEdit ? `/api/collectors/${initial!.id}` : "/api/collectors";
    const method = isEdit ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null, email: email || null, active }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {isEdit ? `Edit ${initial!.name}` : "New Collector"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
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
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CollectorManager({
  performance,
  initialCollectors,
}: {
  performance: PerfRow[];
  initialCollectors: CollectorDTO[];
}) {
  const [collectors, setCollectors] = useState(initialCollectors);
  const [editing, setEditing] = useState<CollectorDTO | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  async function refresh() {
    const res = await fetch("/api/collectors", { cache: "no-store" });
    setCollectors(await res.json());
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this collector? Gate passes must be reassigned first.")) return;
    const res = await fetch(`/api/collectors/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Cannot delete: this collector is still linked to gate passes.");
      return;
    }
    await refresh();
  }

  return (
    <div>
      <SectionHeader
        title="🏆 Collector Performance"
        subtitle="Performance des collecteurs"
        action={
          <button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Collector
          </button>
        }
      />

      <Card className="mb-6 overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Collecteur</th>
              <th className="px-4 py-3">Total collecté</th>
              <th className="px-4 py-3">Temps moyen</th>
              <th className="px-4 py-3">Plus rapide</th>
              <th className="px-4 py-3">Plus long</th>
              <th className="px-4 py-3">% des collectes</th>
              <th className="px-4 py-3">Classement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {performance.map((row) => (
              <tr key={row.name} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3">{row.totalCollected}</td>
                <td className="px-4 py-3">{formatDuration(row.avgHours)}</td>
                <td className="px-4 py-3">{formatDuration(row.fastestHours)}</td>
                <td className="px-4 py-3">{formatDuration(row.longestHours)}</td>
                <td className="px-4 py-3">{(row.shareOfCollections * 100).toFixed(0)}%</td>
                <td className="px-4 py-3">
                  <Badge>{`#${row.rank}`}</Badge>
                </td>
              </tr>
            ))}
            {performance.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No collections recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Manage collectors</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Gate Passes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {collectors.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3">{c.phone ?? "—"}</td>
                <td className="px-4 py-3">{c.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge>{c.active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">{c._count?.gatePasses ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {formOpen && (
        <CollectorFormModal
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
