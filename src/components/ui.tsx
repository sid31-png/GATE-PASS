import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "green" | "amber" | "red" | "slate";
}) {
  const accentClass: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    slate: "text-slate-900",
  };
  return (
    <Card>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={clsx("mt-2 text-2xl font-bold", accentClass[accent ?? "slate"])}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </Card>
  );
}

const BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  COLLECTED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
  "Rapide (≤24h)": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Normal (24-48h)": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Lent (>48h)": "bg-red-50 text-red-700 ring-red-600/20",
  "Overdue (>48h)": "bg-red-50 text-red-700 ring-red-600/20",
  "En attente": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Annulé: "bg-slate-100 text-slate-500 ring-slate-500/20",
  Haute: "bg-red-50 text-red-700 ring-red-600/20",
  Basse: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function Badge({ children }: { children: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        BADGE_STYLES[children] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
