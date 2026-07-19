"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { Role } from "@/lib/rbac";

type Profile = { id: number; name: string; role: Role; roleLabel: string };

const ROLE_GROUP_ORDER: Role[] = ["CEO", "SUPER_ADMIN", "OPS_ADMIN", "AM_LEAD", "AM", "OPERATOR"];

function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profiles")
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: selected.id, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Invalid password.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  const grouped = ROLE_GROUP_ORDER.map((role) => ({
    role,
    profiles: (profiles ?? []).filter((p) => p.role === role),
  })).filter((g) => g.profiles.length > 0);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #1c2a5e, #293d81)" }}
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-white p-3 shadow-lg">
            <Image src="/rch-logo.png" alt="RCH" width={130} height={53} priority />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white">Gate Pass &amp; Delivery CRM</h1>
          <p className="mt-1 text-sm text-white/60">Select your profile to sign in</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          {!selected ? (
            <>
              {profiles === null && <div className="py-10 text-center text-sm text-slate-400">Loading profiles…</div>}
              {profiles !== null && profiles.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">No profiles available.</div>
              )}
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                {grouped.map((g) => (
                  <div key={g.role}>
                    <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      {g.profiles[0].roleLabel}
                    </div>
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                      {g.profiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelected(p);
                            setError(null);
                            setPassword("");
                          }}
                          className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#af1882]/5"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#af1882]/10 text-xs font-bold text-[#af1882]">
                            {initials(p.name)}
                          </span>
                          <span className="text-sm font-medium text-slate-800">{p.name}</span>
                          <span className="ml-auto text-slate-300">›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="mx-auto max-w-sm">
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setError(null);
                }}
                className="mb-4 text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                ← Choose a different profile
              </button>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#af1882]/10 text-base font-bold text-[#af1882]">
                  {initials(selected.name)}
                </span>
                <div>
                  <div className="font-semibold text-slate-900">{selected.name}</div>
                  <div className="text-xs text-slate-500">{selected.roleLabel}</div>
                </div>
              </div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#af1882] focus:outline-none focus:ring-1 focus:ring-[#af1882]"
                placeholder="Enter your password"
              />
              {error && <div className="mt-2 text-sm font-medium text-red-600">{error}</div>}
              <button
                type="submit"
                disabled={busy || !password}
                className={clsx(
                  "mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors",
                  busy || !password ? "bg-slate-300" : "bg-[#af1882] hover:bg-[#8f1468]"
                )}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-white/40">RCH Business Solutions · Access is logged and restricted by role</p>
      </div>
    </div>
  );
}
