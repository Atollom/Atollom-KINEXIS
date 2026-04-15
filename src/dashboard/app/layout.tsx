import type { Metadata } from "next";
import "./globals.css";

import { createClient } from "@/lib/supabase";
import { DashboardShell } from "@/components/DashboardShell";
import { getAuthenticatedTenant } from "@/lib/auth";
import type { UserRole } from "@/types";

export const metadata: Metadata = {
  title: "KINEXIS — Centro de Operaciones",
  description:
    "Plataforma de automatización multi-agente para e-commerce. 43 agentes IA operando en tiempo real.",
  keywords: ["kinexis", "ecommerce", "ai", "agents", "dashboard"],
};

import { Providers } from "@/components/Providers";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createClient();
  const userData = await getAuthenticatedTenant(supabase);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>
          {userData ? (
            <DashboardShell 
              userRole={userData.role} 
              userName={userData.name}
              tenantName={userData.tenant_name}
              planId={userData.plan_id || "enterprise"}
            >
              {children}
            </DashboardShell>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
