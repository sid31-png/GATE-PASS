"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { Card, SectionHeader } from "@/components/ui";

type ColumnResult = {
  amRawName: string;
  matchedEmployee: string | null;
  companiesFound: number;
  toCreate: number;
  toLink: number;
  alreadyLinked: number;
};

type ImportSummary = {
  dryRun: boolean;
  totalCompanies: number;
  totalCreated: number;
  totalLinked: number;
  columns: ColumnResult[];
};

function SummaryTable({ summary }: { summary: ImportSummary }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Column</th>
            <th className="px-4 py-3">Matched Employee</th>
            <th className="px-4 py-3">Companies</th>
            <th className="px-4 py-3">New</th>
            <th className="px-4 py-3">Re-linked</th>
            <th className="px-4 py-3">Already linked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {summary.columns.map((c) => (
            <tr key={c.amRawName} className={!c.matchedEmployee ? "bg-red-50 dark:bg-red-500/5" : ""}>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.amRawName}</td>
              <td className="px-4 py-3">
                {c.matchedEmployee ?? (
                  <span className="text-red-600 dark:text-red-400">No matching Account Manager — skipped</span>
                )}
              </td>
              <td className="px-4 py-3">{c.companiesFound}</td>
              <td className="px-4 py-3">{c.toCreate}</td>
              <td className="px-4 py-3">{c.toLink}</td>
              <td className="px-4 py-3">{c.alreadyLinked}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default function CompanyImportPage() {
  const { can } = useCurrentUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [applied, setApplied] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!can("import_companies")) {
    return (
      <div>
        <SectionHeader title="📅 Import Companies" subtitle="Account Manager allocation spreadsheet" />
        <Card className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          🔒 Access restricted to Operations Admin (Ahmed) and Super Admin (MED-DARWISH). Switch your account in the
          sidebar if you have the right role.
        </Card>
      </div>
    );
  }

  async function run(dryRun: boolean) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/companies/import?dryRun=${dryRun ? "1" : "0"}`, { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Import failed.");
      return;
    }
    const data = (await res.json()) as ImportSummary;
    if (dryRun) {
      setPreview(data);
      setApplied(null);
    } else {
      setApplied(data);
    }
  }

  return (
    <div>
      <SectionHeader
        title="📅 Import Companies"
        subtitle="Upload the AM allocation spreadsheet (one Account Manager per column, company names down the rows)"
      />

      <Card className="mb-6 max-w-lg">
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Spreadsheet (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setApplied(null);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#af1882] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#8f1468] dark:text-slate-400"
        />
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button
            disabled={!file || busy}
            onClick={() => run(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {busy ? "Working…" : "Preview"}
          </button>
          <button
            disabled={!preview || busy}
            onClick={() => run(false)}
            className="rounded-lg bg-[#af1882] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1468] disabled:opacity-50"
          >
            Apply Import
          </button>
        </div>
      </Card>

      {preview && !applied && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Preview — {preview.totalCompanies} companies, {preview.totalCreated} new, {preview.totalLinked} re-linked
          </h2>
          <SummaryTable summary={preview} />
        </div>
      )}
      {applied && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            ✓ Import applied — {applied.totalCreated} companies created, {applied.totalLinked} re-linked to a new AM
          </h2>
          <SummaryTable summary={applied} />
        </div>
      )}
    </div>
  );
}
