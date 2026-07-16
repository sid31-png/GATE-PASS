"use client";

import { useState } from "react";
import { CompanyDTO, DeliveryTaskDTO, EmployeeDTO, GatePassDTO } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/delivery";
import { Badge, Card, KpiCard, SectionHeader } from "@/components/ui";

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

function NewTaskForm({
  onlineEmployees,
  companies,
  gatePasses,
  onClose,
  onSaved,
}: {
  onlineEmployees: EmployeeDTO[];
  companies: CompanyDTO[];
  gatePasses: GatePassDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState<number | "">("");
  const [gatePassId, setGatePassId] = useState<number | "">("");
  const [createdById, setCreatedById] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/delivery-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        companyId: companyId || null,
        gatePassId: gatePassId || null,
        createdById: createdById || null,
        stage: "ONLINE",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not create this task.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">New order / task</h2>
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
              placeholder="e.g. Prepare renewal file for…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Gate pass
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={gatePassId}
                onChange={(e) => setGatePassId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">—</option>
                {gatePasses.map((gp) => (
                  <option key={gp.id} value={gp.id}>
                    {gp.number}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Prepared by
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={createdById}
              onChange={(e) => setCreatedById(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">—</option>
              {onlineEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
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
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OnlineTeamBoard({
  initialTasks,
  employees,
  companies,
  gatePasses,
}: {
  initialTasks: DeliveryTaskDTO[];
  employees: EmployeeDTO[];
  companies: CompanyDTO[];
  gatePasses: GatePassDTO[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [formOpen, setFormOpen] = useState(false);
  const onlineEmployees = employees.filter((e) => e.isOnline);

  async function refresh() {
    const res = await fetch("/api/delivery-tasks?stages=ONLINE,DISPATCH", { cache: "no-store" });
    setTasks(await res.json());
  }

  async function sendToDispatch(taskId: number) {
    await fetch(`/api/delivery-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "DISPATCH" }),
    });
    await refresh();
  }

  const inPrep = tasks.filter((t) => t.stage === "ONLINE");
  const sent = tasks.filter((t) => t.stage === "DISPATCH");

  return (
    <div>
      <SectionHeader
        title="💻 Online Team — Order Processing"
        subtitle="Validate documents and prepare files before sending to Dispatch"
        action={
          <button
            onClick={() => setFormOpen(true)}
            className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
          >
            + New order / task
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <KpiCard label="In Preparation" value={String(inPrep.length)} accent="brand" />
        <KpiCard label="Sent to Dispatch" value={String(sent.length)} accent="blue" />
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          🗂 In preparation — validate &amp; prepare before sending
        </h2>
        <div className="space-y-3">
          {inPrep.map((task) => (
            <Card key={task.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{task.title}</span>
                  <Badge>{STAGE_LABEL[task.stage]}</Badge>
                </div>
                {task.description && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                )}
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {task.company?.name && <span>{task.company.name}</span>}
                  {task.gatePass?.number && <span> · {task.gatePass.number}</span>}
                  {task.createdBy?.name && <span> · by {task.createdBy.name}</span>}
                  <span> · {fmt(task.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={() => sendToDispatch(task.id)}
                className="shrink-0 rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
              >
                Send to Dispatch →
              </button>
            </Card>
          ))}
          {inPrep.length === 0 && (
            <Card className="text-center text-sm text-slate-400 dark:text-slate-500">
              Nothing in preparation. Use “New order / task” to add one.
            </Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          ⏩ Sent — awaiting MED-DARWISH assignment
        </h2>
        <div className="space-y-3">
          {sent.map((task) => (
            <Card key={task.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{task.title}</span>
                  <Badge>{STAGE_LABEL[task.stage]}</Badge>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {task.company?.name && <span>{task.company.name}</span>}
                  {task.gatePass?.number && <span> · {task.gatePass.number}</span>}
                </div>
              </div>
            </Card>
          ))}
          {sent.length === 0 && (
            <Card className="text-center text-sm text-slate-400 dark:text-slate-500">
              Nothing waiting on the manager right now.
            </Card>
          )}
        </div>
      </div>

      {formOpen && (
        <NewTaskForm
          onlineEmployees={onlineEmployees}
          companies={companies}
          gatePasses={gatePasses}
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
