import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAllocationWorkbook, normalizeAMName } from "@/lib/company-import";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get("dryRun") === "1";

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Upload a .xlsx file under the 'file' field." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  let columns;
  try {
    columns = parseAllocationWorkbook(buffer);
  } catch {
    return NextResponse.json({ error: "Could not parse this file as an Excel spreadsheet." }, { status: 400 });
  }
  if (!columns.length) {
    return NextResponse.json({ error: "No columns found — expecting one Account Manager name per column header." }, { status: 400 });
  }

  const amEmployees = await prisma.employee.findMany({ where: { isAM: true } });
  const amByUpper = new Map(amEmployees.map((e) => [e.name.toUpperCase(), e]));

  const companies = await prisma.company.findMany({ select: { id: true, name: true, accountManagerId: true } });
  const companyByUpper = new Map(companies.map((c) => [c.name.toUpperCase(), c]));

  const columnResults: {
    amRawName: string;
    matchedEmployee: string | null;
    companiesFound: number;
    toCreate: number;
    toLink: number;
    alreadyLinked: number;
  }[] = [];

  let totalCreated = 0;
  let totalLinked = 0;

  for (const col of columns) {
    const normalized = normalizeAMName(col.amRawName);
    const employee = amByUpper.get(normalized.toUpperCase()) ?? amByUpper.get(col.amRawName.toUpperCase());

    if (!employee) {
      columnResults.push({
        amRawName: col.amRawName,
        matchedEmployee: null,
        companiesFound: col.companies.length,
        toCreate: 0,
        toLink: 0,
        alreadyLinked: 0,
      });
      continue;
    }

    let toCreate = 0;
    let toLink = 0;
    let alreadyLinked = 0;

    for (const name of col.companies) {
      const key = name.toUpperCase();
      const existing = companyByUpper.get(key);
      if (existing) {
        if (existing.accountManagerId === employee.id) {
          alreadyLinked++;
        } else {
          toLink++;
          if (!dryRun) {
            await prisma.company.update({ where: { id: existing.id }, data: { accountManagerId: employee.id } });
          }
          existing.accountManagerId = employee.id;
        }
      } else {
        toCreate++;
        if (!dryRun) {
          const created = await prisma.company.create({ data: { name, accountManagerId: employee.id } });
          companyByUpper.set(key, { id: created.id, name, accountManagerId: employee.id });
        } else {
          companyByUpper.set(key, { id: -1, name, accountManagerId: employee.id });
        }
      }
    }

    totalCreated += toCreate;
    totalLinked += toLink;
    columnResults.push({
      amRawName: col.amRawName,
      matchedEmployee: employee.name,
      companiesFound: col.companies.length,
      toCreate,
      toLink,
      alreadyLinked,
    });
  }

  return NextResponse.json({
    dryRun,
    totalCompanies: columns.reduce((sum, c) => sum + c.companies.length, 0),
    totalCreated,
    totalLinked,
    columns: columnResults,
  });
}
