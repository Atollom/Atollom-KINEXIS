import type { Metadata } from "next";
import "./globals.css";

import { createClient } from "@/lib/supabase";
import { DashboardShell } from "@/components/DashboardShell";
import type { UserRole } from "@/types";

export const metadata: Metadata = {
  title: "KINEXIS — Centro de Operaciones",
  description:
    "Plataforma de automatización multi-agente para e-commerce. 43 agentes IA operando en tiempo real.",
  keywords: ["kinexis", "ecommerce", "ai", "agents", "dashboard"],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let userRole: UserRole = "viewer";
  let userName = "";

  if (session?.user) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (profile && !profileError) {
        userRole = profile.role as UserRole;
        userName =
          profile.full_name || session.user.email?.split("@")[0] || "";
      } else {
        // Profile query failed (possibly RLS issue) — use safe defaults
        userName = session.user.email?.split("@")[0] || "";
        console.error("[layout] user_profiles query failed:", profileError?.message);
      }
    } catch (err) {
      // Catch any unexpected error to prevent full page crash
      userName = session.user.email?.split("@")[0] || "";
      console.error("[layout] user_profiles query crashed:", err);
    }
  }

  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0D1B3E] text-[#d7e7ff] overflow-x-hidden antialiased">
        {session ? (
          <DashboardShell userRole={userRole} userName={userName}>
            {children}
          </DashboardShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
