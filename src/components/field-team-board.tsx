"use client";

import { useEffect, useState } from "react";
import { DeliveryTaskDTO, EmployeeDTO } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/delivery";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { useCurrentUser } from "@/lib/current-user";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BlockModal({
  task,
  onClose,
  onSaved,
}: {
  task: DeliveryTaskDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSaving(true);
    await fetch(`/api/delivery-tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "BLOCKED", blockedReason: reason }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          What&apos;s blocking this mission?
        </h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{task.title}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            required
            autoFocus
            rows={3}
            placeholder="e.g. Office closed, missing document, contact unavailable…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
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
              {saving ? "Reporting…" : "Report blocker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FieldTeamBoard({
  initialTasks,
  fieldEmployees,
}: {
  initialTasks: DeliveryTaskDTO[];
  fieldEmployees: EmployeeDTO[];
}) {
  const { can } = useCurrentUser();
  const canValidate = can("dispatch_field_assign"); // "valider les livraisons" — MED-DARWISH/CEO only
  const canLogProgress = can("update_field_status"); // start/blocked/resume — CEO/SUPER_ADMIN/Online Operators
  const [tasks, setTasks] = useState(initialTasks);
  const [agentName, setAgentName] = useState<string>("");
  const [blocking, setBlocking] = useState<DeliveryTaskDTO | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("rch-field-agent");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage on mount only
    if (saved) setAgentName(saved);
  }, []);

  function selectAgent(name: string) {
    setAgentName(name);
    window.localStorage.setItem("rch-field-agent", name);
  }

  async function refresh() {
    const res = await fetch("/api/delivery-tasks?stages=ASSIGNED,IN_PROGRESS,BLOCKED", { cache: "no-store" });
    setTasks(await res.json());
  }

  async function setStage(taskId: number, stage: string) {
    await fetch(`/api/delivery-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    await refresh();
  }

  const myTasks = agentName ? tasks.filter((t) => t.assignedTo?.name === agentName) : tasks;
  const sorted = [...myTasks].sort((a, b) => {
    const order: Record<string, number> = { ASSIGNED: 0, IN_PROGRESS: 1, BLOCKED: 2 };
    return (order[a.stage] ?? 3) - (order[b.stage] ?? 3);
  });

  return (
    <div className="mx-auto max-w-xl">
      <SectionHeader
        title="🚚 Field Missions"
        subtitle={
          canLogProgress
            ? "Today's deliveries & government trips"
            : "🔒 View only — status updates are entered by MED-DARWISH or an Online Operator."
        }
      />

      <Card className="mb-4">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          I am…
        </label>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={agentName}
          onChange={(e) => selectAgent(e.target.value)}
        >
          <option value="">All agents (supervisor view)</option>
          {fieldEmployees.map((emp) => (
            <option key={emp.id} value={emp.name}>
              {emp.name}
            </option>
          ))}
        </select>
      </Card>

      <div className="space-y-3">
        {sorted.map((task) => (
          <Card key={task.id}>
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</span>
              <Badge>{STAGE_LABEL[task.stage]}</Badge>
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
            )}
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {task.company?.name && <span>{task.company.name}</span>}
              {task.gatePass?.number && <span> · {task.gatePass.number}</span>}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Departure: {fmt(task.scheduledAt)} {!agentName && task.assignedTo && `· ${task.assignedTo.name}`}
            </div>
            {task.instructions && (
              <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                📋 {task.instructions}
              </div>
            )}
            {task.blockedReason && (
              <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                ⚠ {task.blockedReason}
              </div>
            )}

            {(canLogProgress || canValidate) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {task.stage === "ASSIGNED" && canLogProgress && (
                  <>
                    <button
                      onClick={() => setStage(task.id, "IN_PROGRESS")}
                      className="flex-1 rounded-lg bg-[#af1882] px-3 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
                    >
                      ▶ Start mission
                    </button>
                    <button
                      onClick={() => setBlocking(task)}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                    >
                      Blocked
                    </button>
                  </>
                )}
                {task.stage === "IN_PROGRESS" && (
                  <>
                    {canValidate && (
                      <button
                        onClick={() => setStage(task.id, "COMPLETED")}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        ✓ Mark completed
                      </button>
                    )}
                    {canLogProgress && (
                      <button
                        onClick={() => setBlocking(task)}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                      >
                        Blocked
                      </button>
                    )}
                  </>
                )}
                {task.stage === "BLOCKED" && canLogProgress && (
                  <button
                    onClick={() => setStage(task.id, "IN_PROGRESS")}
                    className="flex-1 rounded-lg bg-[#af1882] px-3 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
                  >
                    ↻ Resume mission
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}
        {sorted.length === 0 && (
          <Card className="text-center text-sm text-slate-400 dark:text-slate-500">
            No missions {agentName ? `for ${agentName}` : ""} right now. 🎉
          </Card>
        )}
      </div>

      {blocking && (
        <BlockModal
          task={blocking}
          onClose={() => setBlocking(null)}
          onSaved={async () => {
            setBlocking(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
