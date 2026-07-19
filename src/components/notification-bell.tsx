"use client";

import { useEffect, useState } from "react";
import { ServiceRequestDTO } from "@/lib/types";

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// Near-real-time alert center for an Online Operator: the parent board
// polls the API on an interval and passes down the operator's own
// newly-assigned requests; this component just tracks which ones the
// operator has already seen (in localStorage) and renders the bell/badge.
export function NotificationBell({ employeeId, requests }: { employeeId: number; requests: ServiceRequestDTO[] }) {
  const storageKey = `rch-notif-seen-${employeeId}`;
  const [seenIds, setSeenIds] = useState<number[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage on mount only
      setSeenIds(raw ? JSON.parse(raw) : []);
    } catch {
      setSeenIds([]);
    }
  }, [storageKey]);

  const unseen = seenIds === null ? [] : requests.filter((r) => !seenIds.includes(r.id));

  function markAllSeen() {
    const ids = requests.map((r) => r.id);
    setSeenIds(ids);
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) markAllSeen();
        }}
        className="relative rounded-lg border border-slate-300 px-2.5 py-2 text-base text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        🔔
        {unseen.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unseen.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-1 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Newly assigned to you
          </div>
          {requests.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-slate-400 dark:text-slate-500">Nothing waiting right now.</div>
          )}
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg px-2 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="font-medium text-slate-800 dark:text-slate-200">{r.title}</div>
                <div className="mt-0.5 text-slate-400 dark:text-slate-500">
                  {r.createdBy.name}
                  {r.company?.name ? ` · ${r.company.name}` : ""} · {fmtTime(r.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
