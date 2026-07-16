"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "\u{1F6C2}" },
  { href: "/gate-passes", label: "Gate Pass Tracker", icon: "\u{1F4CB}" },
  { href: "/pending", label: "Pending", icon: "⏳" },
  { href: "/collectors", label: "Collector Performance", icon: "\u{1F3C6}" },
  { href: "/companies", label: "Companies", icon: "\u{1F3E2}" },
  { href: "/analytics", label: "Analytics", icon: "\u{1F4CA}" },
  { href: "/account-managers", label: "Account Managers", icon: "\u{1F9D1}‍\u{1F4BC}" },
  { href: "/request-queue", label: "Online Queue", icon: "\u{1F4E5}" },
  { href: "/dispatch", label: "Dispatch", icon: "\u{1F4E1}" },
  { href: "/online", label: "Online Team", icon: "\u{1F4BB}" },
  { href: "/field", label: "Field Team", icon: "\u{1F69A}" },
  { href: "/deliveries", label: "Deliveries", icon: "\u{1F4E6}" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white lg:flex lg:flex-col">
      <div className="px-6 py-6">
        <Image src="/rch-logo.png" alt="RCH" width={120} height={49} priority />
        <div className="mt-2 text-xs font-medium text-slate-500">Gate Pass CRM</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-l-[#af1882] bg-[#af1882]/10 text-[#af1882]"
                  : "border-l-transparent text-slate-500 hover:bg-slate-50 hover:text-[#af1882]"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-slate-400">RCH Business Solutions</div>
    </aside>
  );
}
