import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { CurrentUserProvider } from "@/lib/current-user";
import { getSessionEmployee } from "@/lib/session";
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
  const employee = await getSessionEmployee();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <CurrentUserProvider employee={employee ? (JSON.parse(JSON.stringify(employee)) as EmployeeDTO) : null}>
          <AppShell>{children}</AppShell>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
