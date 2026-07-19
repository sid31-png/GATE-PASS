"use client";

import { useMemo, useState } from "react";
import { DeliveryTaskDTO, EmployeeDTO } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/delivery";
import { Badge, Card, HeroBand, HeroStat, SectionHeader } from "@/components/ui";
import { useCurrentUser } from "@/lib/current-user";

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

function countOverdue(tasks: DeliveryTaskDTO[]) {
  const now = Date.now();
  return tasks.filter((t) => t.stage === "ASSIGNED" && t.scheduledAt && new Date(t.scheduledAt).getTime() < now)
    .length;
}

function TaskMeta({ task }: { task: DeliveryTaskDTO }) {
  return (
    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {task.company?.name && <span>{task.company.name}</span>}
      {task.gatePass?.number && <span> · {task.gatePass.number}</span>}
      {task.createdBy?.name && <span> · prepared by {task.createdBy.name}</span>}
    </div>
  );
}

function AssignModal({
  task,
  fieldEmployees,
  managerId,
  onClose,
  onSaved,
}: {
  task: DeliveryTaskDTO;
  fieldEmployees: EmployeeDTO[];
  managerId: number | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [assignedToId, setAssignedToId] = useState<number | "">(task.assignedTo?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    task.scheduledAt ? task.scheduledAt.slice(0, 16) : ""
  );
  const [instructions, setInstructions] = useState(task.instructions ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!assignedToId || !scheduledAt) {
      setError("Please choose an agent and a departure date/time.");
      return;
    }
    if (!managerId) {
      setError("No manager (MED-DARWISH) found in the employee roster.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/delivery-tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "ASSIGNED",
        assignedToId,
        assignedById: managerId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        instructions: instructions || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not assign this task.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Assign · {task.title}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Choose the field agent, the departure date/time, and the protocol instructions.
        </p>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Field agent
            </label>
            <select
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={assignedToId}
              onChange={(e) => setAssignedToId(Number(e.target.value))}
            >
              <option value="">Select an agent…</option>
              {fieldEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Departure date/time
            </label>
            <input
              required
              type="datetime-local"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Instructions / protocol
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g. Go to the Ministry of Labour, ask for Mr. X, bring the stamped letter…"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
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
              {saving ? "Assigning…" : "Assign & Dispatch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DispatchBoard({
  initialTasks,
  employees,
}: {
  initialTasks: DeliveryTaskDTO[];
  employees: EmployeeDTO[];
}) {
  const { can } = useCurrentUser();
  const canDispatch = can("dispatch_field_assign");
  const [tasks, setTasks] = useState(initialTasks);
  const [assigning, setAssigning] = useState<DeliveryTaskDTO | null>(null);

  const manager = employees.find((e) => e.isManager);
  const fieldEmployees = employees.filter((e) => e.isField);

  async function refresh() {
    const res = await fetch("/api/delivery-tasks?stages=ONLINE,DISPATCH,ASSIGNED,IN_PROGRESS,BLOCKED", {
      cache: "no-store",
    });
    setTasks(await res.json());
  }

  async function sendBackToDispatch(taskId: number) {
    await fetch(`/api/delivery-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "DISPATCH" }),
    });
    await refresh();
  }

  const kpis = useMemo(() => {
    const byStage = (s: string) => tasks.filter((t) => t.stage === s).length;
    return {
      total: tasks.length,
      online: byStage("ONLINE"),
      readyForDispatch: byStage("DISPATCH"),
      assigned: byStage("ASSIGNED"),
      inProgress: byStage("IN_PROGRESS"),
      blocked: byStage("BLOCKED"),
      overdue: countOverdue(tasks),
    };
  }, [tasks]);

  const byStage = (s: string) => tasks.filter((t) => t.stage === s);

  return (
    <div>
      <SectionHeader
        title="📡 Dispatch — Manager Supervision"
        subtitle={
          canDispatch
            ? "Assign field agents, set instructions, and validate deliveries."
            : "🔒 View only — assigning field agents is exclusive to MED-DARWISH and the CEO."
        }
      />

      <HeroBand>
        <HeroStat label="Active Tasks" value={String(kpis.total)} />
        <HeroStat label="Online Prep" value={String(kpis.online)} />
        <HeroStat label="Ready to Dispatch" value={String(kpis.readyForDispatch)} tone="brand" />
        <HeroStat label="Assigned" value={String(kpis.assigned)} tone="warn" />
        <HeroStat label="In Progress" value={String(kpis.inProgress)} tone="good" />
        <HeroStat label="Blocked" value={String(kpis.blocked)} tone="crit" />
        <HeroStat label="Overdue" value={String(kpis.overdue)} tone="crit" />
      </HeroBand>

      {/* Ready for Dispatch — the quick-assign queue */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          🟣 Ready for Dispatch — needs assignment
        </h2>
        <div className="space-y-3">
          {byStage("DISPATCH").map((task) => (
            <Card key={task.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{task.title}</span>
                  <Badge>{STAGE_LABEL[task.stage]}</Badge>
                </div>
                {task.description && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                )}
                <TaskMeta task={task} />
              </div>
              {canDispatch ? (
                <button
                  onClick={() => setAssigning(task)}
                  className="shrink-0 rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
                >
                  Assign agent
                </button>
              ) : (
                <Badge>Waiting for dispatch</Badge>
              )}
            </Card>
          ))}
          {byStage("DISPATCH").length === 0 && (
            <Card className="text-center text-sm text-slate-400 dark:text-slate-500">
              Nothing waiting for dispatch right now.
            </Card>
          )}
        </div>
      </div>

      {/* Assigned / In progress — live supervision */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          🚚 Assigned &amp; In Progress
        </h2>
        <div className="space-y-3">
          {[...byStage("ASSIGNED"), ...byStage("IN_PROGRESS")].map((task) => (
            <Card key={task.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{task.title}</span>
                  <Badge>{STAGE_LABEL[task.stage]}</Badge>
                </div>
                <TaskMeta task={task} />
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Agent: <strong>{task.assignedTo?.name ?? "—"}</strong> · Departure: {fmt(task.scheduledAt)}
                </div>
                {task.instructions && (
                  <div className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    “{task.instructions}”
                  </div>
                )}
              </div>
              {canDispatch && (
                <button
                  onClick={() => setAssigning(task)}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Reassign
                </button>
              )}
            </Card>
          ))}
          {byStage("ASSIGNED").length === 0 && byStage("IN_PROGRESS").length === 0 && (
            <Card className="text-center text-sm text-slate-400 dark:text-slate-500">
              No missions currently assigned or in progress.
            </Card>
          )}
        </div>
      </div>

      {/* Blocked */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">🔴 Blocked</h2>
        <div className="space-y-3">
          {byStage("BLOCKED").map((task) => (
            <Card key={task.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{task.title}</span>
                  <Badge>{STAGE_LABEL[task.stage]}</Badge>
                </div>
                <TaskMeta task={task} />
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Agent: <strong>{task.assignedTo?.name ?? "—"}</strong>
                </div>
                {task.blockedReason && (
                  <div className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    ⚠ {task.blockedReason}
                  </div>
                )}
              </div>
              {canDispatch && (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setAssigning(task)}
                    className="rounded-lg bg-[#af1882] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8f1468]"
                  >
                    Resolve &amp; reassign
                  </button>
                  <button
                    onClick={() => sendBackToDispatch(task.id)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Send back to queue
                  </button>
                </div>
              )}
            </Card>
          ))}
          {byStage("BLOCKED").length === 0 && (
            <Card className="text-center text-sm text-slate-400 dark:text-slate-500">No blockers reported.</Card>
          )}
        </div>
      </div>

      {/* Online prep — read only visibility for the manager */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          💻 In Online Preparation
        </h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Prepared by</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {byStage("ONLINE").map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{task.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{task.company?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{task.createdBy?.name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {fmt(task.createdAt)}
                  </td>
                </tr>
              ))}
              {byStage("ONLINE").length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    Nothing in preparation right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {assigning && canDispatch && (
        <AssignModal
          task={assigning}
          fieldEmployees={fieldEmployees}
          managerId={manager?.id}
          onClose={() => setAssigning(null)}
          onSaved={async () => {
            setAssigning(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
