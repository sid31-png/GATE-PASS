"use client";

import { useSearchParams } from "next/navigation";

export function AccessDeniedBanner() {
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied");
  if (!denied) return null;

  return (
    <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400">
      🔒 Access restricted — your role doesn&apos;t have permission to view <code>{denied}</code>.
    </div>
  );
}
