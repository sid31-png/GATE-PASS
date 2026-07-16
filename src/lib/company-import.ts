import * as XLSX from "xlsx";

export type ParsedAllocationColumn = {
  amRawName: string;
  companies: string[];
};

/**
 * Reads an "AM name per column, company names down the rows" allocation
 * sheet (the format RCH uses to hand out company -> Account Manager
 * assignments) and returns each column's raw header plus its list of
 * non-empty company names.
 */
export function parseAllocationWorkbook(buffer: ArrayBuffer): ParsedAllocationColumn[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, defval: null });
  if (!rows.length) return [];

  const headers = rows[0].map((h) => (h !== null && h !== undefined ? String(h).trim() : null));
  const columns: ParsedAllocationColumn[] = headers
    .filter((h): h is string => Boolean(h))
    .map((h) => ({ amRawName: h, companies: [] }));

  for (const row of rows.slice(1)) {
    headers.forEach((h, i) => {
      if (!h) return;
      const val = row[i];
      if (val === null || val === undefined) return;
      const name = String(val).trim().replace(/\s+/g, " ");
      if (!name) return;
      columns.find((c) => c.amRawName === h)?.companies.push(name);
    });
  }
  return columns;
}

/** Strips known suffixes/aliases so the sheet's header matches an Employee.name. */
export function normalizeAMName(raw: string): string {
  const stripped = raw.replace(/\s*-\s*RCHBS\s*$/i, "").trim();
  const aliases: Record<string, string> = { GABI: "Gabriela", GABRIELA: "Gabriela", ELENA: "ELENA" };
  const upper = stripped.toUpperCase();
  if (aliases[upper]) return aliases[upper];
  // Title-case everything else (Violetta, Abegail, Vongai, Nasma, Roxana, ...)
  return stripped
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
