"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { EmployeeDTO } from "@/lib/types";
import { Role, roleOf, can, Permission } from "@/lib/rbac";

type CurrentUserContextValue = {
  currentEmployee: EmployeeDTO | null;
  role: Role;
  can: (permission: Permission) => boolean;
  logout: () => Promise<void>;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

// The authenticated employee is resolved server-side (see src/lib/session.ts)
// from the signed session cookie and passed down once from layout.tsx — there
// is no client-side picker anymore. Logging out clears the cookie and sends
// the user back to /login.
export function CurrentUserProvider({
  employee,
  children,
}: {
  employee: EmployeeDTO | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const role = roleOf(employee ?? undefined);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <CurrentUserContext.Provider
      value={{
        currentEmployee: employee,
        role,
        can: (permission) => can(employee ?? undefined, permission),
        logout,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  return ctx;
}
