import { GatePassStatus, GatePassType, RequestType, PassCategory, Location } from "@/generated/prisma/enums";

export type GatePassWithRelations = {
  id: number;
  number: string;
  location: Location;
  gatePassType: GatePassType;
  requestType: RequestType;
  passCategory: PassCategory;
  submittedBy: string;
  submissionAt: Date;
  collectionAt: Date | null;
  status: GatePassStatus;
  remarks: string | null;
  company: { id: number; name: string };
  collector: { id: number; name: string } | null;
};

export const HOUR_MS = 1000 * 60 * 60;
export const DAY_MS = HOUR_MS * 24;

export function processingHours(gp: Pick<GatePassWithRelations, "submissionAt" | "collectionAt">) {
  if (!gp.collectionAt) return null;
  return (gp.collectionAt.getTime() - gp.submissionAt.getTime()) / HOUR_MS;
}

export function daysWaiting(gp: Pick<GatePassWithRelations, "submissionAt">, now = new Date()) {
  return (now.getTime() - gp.submissionAt.getTime()) / DAY_MS;
}

export type DelayCategory =
  | "Fast (≤24h)"
  | "Normal (24-48h)"
  | "Slow (>48h)"
  | "Overdue (>48h)"
  | "Waiting"
  | "Cancelled";

export function delayCategory(gp: GatePassWithRelations, now = new Date()): DelayCategory {
  if (gp.status === GatePassStatus.CANCELLED) return "Cancelled";
  if (gp.status === GatePassStatus.PENDING) {
    return daysWaiting(gp, now) > 2 ? "Overdue (>48h)" : "Waiting";
  }
  const hours = processingHours(gp) ?? 0;
  if (hours <= 24) return "Fast (≤24h)";
  if (hours <= 48) return "Normal (24-48h)";
  return "Slow (>48h)";
}

export type Priority = "High" | "Low";

export function priority(gp: Pick<GatePassWithRelations, "submissionAt">, now = new Date()): Priority {
  return daysWaiting(gp, now) > 1 ? "High" : "Low";
}

export function formatDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const days = Math.floor(hours / 24);
  const rem = hours - days * 24;
  if (days > 0) return `${days}d ${rem.toFixed(1)}h`;
  return `${hours.toFixed(1)}h`;
}

export function computeKpis(gatePasses: GatePassWithRelations[], now = new Date()) {
  const total = gatePasses.length;
  const collected = gatePasses.filter((g) => g.status === GatePassStatus.COLLECTED);
  const pending = gatePasses.filter((g) => g.status === GatePassStatus.PENDING);
  const cancelled = gatePasses.filter((g) => g.status === GatePassStatus.CANCELLED);

  const processingTimes = collected
    .map((g) => processingHours(g))
    .filter((h): h is number => h !== null);

  const avgProcessingHours =
    processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

  const fastest = processingTimes.length > 0 ? Math.min(...processingTimes) : null;
  const longest = processingTimes.length > 0 ? Math.max(...processingTimes) : null;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  const dow = (startOfWeek.getDay() + 6) % 7; // Monday-based
  startOfWeek.setDate(startOfWeek.getDate() - dow);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const processedToday = collected.filter((g) => g.collectionAt! >= startOfDay).length;
  const processedThisWeek = collected.filter((g) => g.collectionAt! >= startOfWeek).length;
  const processedThisMonth = collected.filter((g) => g.collectionAt! >= startOfMonth).length;
  const processedThisYear = collected.filter((g) => g.collectionAt! >= startOfYear).length;

  return {
    total,
    collected: collected.length,
    pending: pending.length,
    cancelled: cancelled.length,
    collectionRate: total > 0 ? collected.length / total : 0,
    avgProcessingHours,
    fastestHours: fastest,
    longestHours: longest,
    processedToday,
    processedThisWeek,
    processedThisMonth,
    processedThisYear,
  };
}

export function computeStatusDistribution(gatePasses: GatePassWithRelations[]) {
  return [
    { name: "Collected", value: gatePasses.filter((g) => g.status === GatePassStatus.COLLECTED).length },
    { name: "Pending", value: gatePasses.filter((g) => g.status === GatePassStatus.PENDING).length },
    { name: "Cancelled", value: gatePasses.filter((g) => g.status === GatePassStatus.CANCELLED).length },
  ];
}

export function computeDailySeries(gatePasses: GatePassWithRelations[], days = 14, now = new Date()) {
  const buckets: { date: string; submitted: number; collected: number }[] = [];
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const submitted = gatePasses.filter((g) => g.submissionAt >= day && g.submissionAt < next).length;
    const collected = gatePasses.filter(
      (g) => g.collectionAt && g.collectionAt >= day && g.collectionAt < next
    ).length;
    buckets.push({ date: day.toISOString().slice(0, 10), submitted, collected });
  }
  return buckets;
}

export function computeWeeklySeries(gatePasses: GatePassWithRelations[], weeks = 8, now = new Date()) {
  const buckets: { weekOf: string; submitted: number; collected: number }[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (today.getDay() + 6) % 7;
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - dow);
  const start = new Date(thisWeekStart);
  start.setDate(start.getDate() - 7 * (weeks - 1));

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const submitted = gatePasses.filter(
      (g) => g.submissionAt >= weekStart && g.submissionAt < weekEnd
    ).length;
    const collected = gatePasses.filter(
      (g) => g.collectionAt && g.collectionAt >= weekStart && g.collectionAt < weekEnd
    ).length;
    buckets.push({ weekOf: weekStart.toISOString().slice(0, 10), submitted, collected });
  }
  return buckets;
}

export function computeMonthlySeries(gatePasses: GatePassWithRelations[], months = 12, now = new Date()) {
  const buckets: { month: string; submitted: number; collected: number }[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 1);
    const submitted = gatePasses.filter(
      (g) => g.submissionAt >= monthStart && g.submissionAt < monthEnd
    ).length;
    const collected = gatePasses.filter(
      (g) => g.collectionAt && g.collectionAt >= monthStart && g.collectionAt < monthEnd
    ).length;
    buckets.push({
      month: monthStart.toISOString().slice(0, 7),
      submitted,
      collected,
    });
  }
  return buckets;
}

export function computeCollectorPerformance(gatePasses: GatePassWithRelations[]) {
  const collected = gatePasses.filter((g) => g.status === GatePassStatus.COLLECTED && g.collector);
  const totalCollected = collected.length;
  const byCollector = new Map<string, { name: string; times: number[] }>();

  for (const g of collected) {
    const name = g.collector!.name;
    const hours = processingHours(g)!;
    if (!byCollector.has(name)) byCollector.set(name, { name, times: [] });
    byCollector.get(name)!.times.push(hours);
  }

  const rows = [...byCollector.values()].map((c) => ({
    name: c.name,
    totalCollected: c.times.length,
    avgHours: c.times.reduce((a, b) => a + b, 0) / c.times.length,
    fastestHours: Math.min(...c.times),
    longestHours: Math.max(...c.times),
    shareOfCollections: totalCollected > 0 ? c.times.length / totalCollected : 0,
  }));

  rows.sort((a, b) => b.totalCollected - a.totalCollected);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function computePivotByCompanyStatus(gatePasses: GatePassWithRelations[]) {
  const companies = [...new Set(gatePasses.map((g) => g.company.name))].sort();
  const statuses: GatePassStatus[] = [
    GatePassStatus.CANCELLED,
    GatePassStatus.COLLECTED,
    GatePassStatus.PENDING,
  ];

  const rows = companies.map((company) => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const status of statuses) {
      const count = gatePasses.filter(
        (g) => g.company.name === company && g.status === status
      ).length;
      counts[status] = count;
      total += count;
    }
    return { company, counts, total };
  });

  const grandTotal: Record<string, number> = {};
  for (const status of statuses) {
    grandTotal[status] = gatePasses.filter((g) => g.status === status).length;
  }

  return { rows, statuses, grandTotal, grandTotalAll: gatePasses.length };
}

export function computePivotByCollector(gatePasses: GatePassWithRelations[]) {
  const names = [...new Set(gatePasses.map((g) => g.collector?.name ?? "(unassigned)"))].sort();
  const rows = names.map((name) => ({
    name,
    count: gatePasses.filter((g) => (g.collector?.name ?? "(unassigned)") === name).length,
  }));
  rows.sort((a, b) => b.count - a.count);
  return rows;
}

export function computePivotByLocationStatus(gatePasses: GatePassWithRelations[]) {
  const locations = [...new Set(gatePasses.map((g) => g.location))].sort();
  const statuses: GatePassStatus[] = [
    GatePassStatus.CANCELLED,
    GatePassStatus.COLLECTED,
    GatePassStatus.PENDING,
  ];

  const rows = locations.map((location) => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const status of statuses) {
      const count = gatePasses.filter((g) => g.location === location && g.status === status).length;
      counts[status] = count;
      total += count;
    }
    return { location, counts, total };
  });

  const grandTotal: Record<string, number> = {};
  for (const status of statuses) {
    grandTotal[status] = gatePasses.filter((g) => g.status === status).length;
  }

  return { rows, statuses, grandTotal, grandTotalAll: gatePasses.length };
}
