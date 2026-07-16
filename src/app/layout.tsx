import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { CurrentUserProvider } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { EmployeeDTO } from "@/lib/types";

export const metadata: Metadata = {
  title: "RCH · Gate Pass CRM",
  description: "Gate pass submission and collection tracking system",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const employees = await prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <CurrentUserProvider employees={JSON.parse(JSON.stringify(employees)) as EmployeeDTO[]}>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 px-6 py-6 lg:px-10 lg:py-8">
              <MobileNav />
              {children}
            </main>
          </div>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
