import { prisma } from "@/lib/prisma";
import { CompanyManager } from "@/components/company-manager";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { gatePasses: true } } },
    orderBy: { name: "asc" },
  });

  return <CompanyManager initialCompanies={JSON.parse(JSON.stringify(companies))} />;
}
