"use client";

import { useEffect, useState } from "react";
import { ServiceRequestDTO } from "@/lib/types";
import { NotificationBell } from "@/components/notification-bell";

const POLL_INTERVAL_MS = 12_000;

// Self-contained bell for an Online Operator: fetches (and polls) their own
// newly auto-assigned requests directly, so it can be dropped onto any page
// — not just the Online Queue — such as the main Dashboard.
export function OperatorNotificationWidget({ employeeId }: { employeeId: number }) {
  const [requests, setRequests] = useState<ServiceRequestDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/service-requests?claimedById=${employeeId}&status=ASSIGNED_TO_ONLINE`, {
        cache: "no-store",
      });
      if (!cancelled && res.ok) setRequests(await res.json());
    }
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [employeeId]);

  return <NotificationBell employeeId={employeeId} requests={requests} />;
}
