"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { EmployeeDTO } from "@/lib/types";
import { Role, roleOf, can, Permission } from "@/lib/rbac";

const STORAGE_KEY = "rch-current-employee-id";

type CurrentUserContextValue = {
  employees: EmployeeDTO[];
  currentEmployee: EmployeeDTO | null;
  setCurrentEmployeeId: (id: number | null) => void;
  role: Role;
  can: (permission: Permission) => boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ employees, children }: { employees: EmployeeDTO[]; children: React.ReactNode }) {
  const [currentId, setCurrentId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage on mount only
      if (saved) setCurrentId(Number(saved));
    } catch {
      /* ignore */
    }
  }, []);

  function setCurrentEmployeeId(id: number | null) {
    setCurrentId(id);
    try {
      if (id === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      /* ignore */
    }
  }

  const currentEmployee = employees.find((e) => e.id === currentId) ?? null;
  const role = roleOf(currentEmployee ?? undefined);

  return (
    <CurrentUserContext.Provider
      value={{
        employees,
        currentEmployee,
        setCurrentEmployeeId,
        role,
        can: (permission) => can(currentEmployee ?? undefined, permission),
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
