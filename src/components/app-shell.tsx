"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { AccessDeniedBanner } from "@/components/access-denied-banner";

// /login renders full-bleed with no sidebar/nav chrome — everything else
// gets the normal authenticated app shell.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-6 py-6 lg:px-10 lg:py-8">
        <MobileNav />
        <Suspense fallback={null}>
          <AccessDeniedBanner />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
