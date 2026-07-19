"use client";

import { useState } from "react";
import { CompanyDTO, EmployeeDTO } from "@/lib/types";
import { NewGatePassRequestModal, NewRequestModal } from "@/components/service-request-modals";
import { canCreateGatePassRequest } from "@/lib/gate-pass-requests";

// The same two request-creation buttons shown on the Account Managers page,
// reusable anywhere an AM/AM Lead/admin should be able to start a request
// (e.g. their own Dashboard) without navigating away first.
export function AMQuickActions({
  amEmployees,
  companies,
  currentEmployee,
  onSaved,
}: {
  amEmployees: EmployeeDTO[];
  companies: CompanyDTO[];
  currentEmployee: EmployeeDTO | null;
  onSaved?: () => void;
}) {
  const [proFormOpen, setProFormOpen] = useState(false);
  const [gatePassFormOpen, setGatePassFormOpen] = useState(false);
  const showGatePassButton = canCreateGatePassRequest(currentEmployee);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setProFormOpen(true)}
          className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468]"
        >
          + PRO Service Request
        </button>
        {showGatePassButton && (
          <button
            onClick={() => setGatePassFormOpen(true)}
            className="rounded-lg border border-[#af1882] px-4 py-2 text-sm font-medium text-[#af1882] hover:bg-[#af1882]/5"
          >
            + Gate Pass Request
          </button>
        )}
      </div>
      {proFormOpen && (
        <NewRequestModal
          amEmployees={amEmployees}
          companies={companies}
          currentEmployee={currentEmployee}
          onClose={() => setProFormOpen(false)}
          onSaved={() => {
            setProFormOpen(false);
            onSaved?.();
          }}
        />
      )}
      {gatePassFormOpen && showGatePassButton && (
        <NewGatePassRequestModal
          amEmployees={amEmployees}
          companies={companies}
          currentEmployee={currentEmployee}
          onClose={() => setGatePassFormOpen(false)}
          onSaved={() => {
            setGatePassFormOpen(false);
            onSaved?.();
          }}
        />
      )}
    </>
  );
}
