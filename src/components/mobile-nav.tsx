"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useCurrentUser } from "@/lib/current-user";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/gate-passes", label: "Tracker" },
  { href: "/pending", label: "Pending" },
  { href: "/collectors", label: "Performance" },
  { href: "/companies", label: "Companies" },
  { href: "/analytics", label: "Analytics" },
  { href: "/account-managers", label: "Account Managers", roles: ["AM", "AM_LEAD", "OPS_ADMIN", "SUPER_ADMIN"] },
  { href: "/request-queue", label: "Online Queue", roles: ["OPERATOR", "OPS_ADMIN", "SUPER_ADMIN"] },
  { href: "/company-import", label: "Import Companies", roles: ["OPS_ADMIN", "SUPER_ADMIN"] },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/online", label: "Online Team" },
  { href: "/field", label: "Field Team" },
  { href: "/deliveries", label: "Deliveries" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useCurrentUser();
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3 dark:border-slate-800 lg:hidden">
      {visibleItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
              active
                ? "bg-[#af1882] text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
