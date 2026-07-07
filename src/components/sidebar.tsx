"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "\u{1F6C2}" },
  { href: "/gate-passes", label: "Gate Pass Tracker", icon: "\u{1F4CB}" },
  { href: "/pending", label: "Pending", icon: "⏳" },
  { href: "/collectors", label: "Collector Performance", icon: "\u{1F3C6}" },
  { href: "/companies", label: "Companies", icon: "\u{1F3E2}" },
  { href: "/analytics", label: "Analytics / Pivot", icon: "\u{1F4CA}" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold tracking-tight text-slate-900">
          🛂 Gate Pass CRM
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Suivi des soumissions et collectes
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-slate-400">Qatar Operations</div>
    </aside>
  );
}
