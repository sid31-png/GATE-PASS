"use client";

import { CompanyDTO, EmployeeDTO } from "@/lib/types";
import { useCurrentUser } from "@/lib/current-user";
import { AMQuickActions } from "@/components/am-quick-actions";
import { OperatorNotificationWidget } from "@/components/operator-notification-widget";

// Surfaces the same "create a request" buttons (Account Managers page) and
// notification bell (Online Queue page) directly on every user's own main
// Dashboard, so they don't have to navigate to a dedicated page first.
export function DashboardQuickActions({
  amEmployees,
  companies,
}: {
  amEmployees: EmployeeDTO[];
  companies: CompanyDTO[];
}) {
  const { currentEmployee, can } = useCurrentUser();
  const showAMActions = can("create_service_request");
  const showBell = Boolean(currentEmployee?.isOnline);

  if (!showAMActions && !showBell) return null;

  return (
    <div className="flex items-center gap-2">
      {showBell && currentEmployee && <OperatorNotificationWidget employeeId={currentEmployee.id} />}
      {showAMActions && (
        <AMQuickActions amEmployees={amEmployees} companies={companies} currentEmployee={currentEmployee} />
      )}
    </div>
  );
}
