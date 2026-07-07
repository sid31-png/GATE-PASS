"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/gate-passes", label: "Tracker" },
  { href: "/pending", label: "Pending" },
  { href: "/collectors", label: "Performance" },
  { href: "/companies", label: "Companies" },
  { href: "/analytics", label: "Analytics" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
              active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
