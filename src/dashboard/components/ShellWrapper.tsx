"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "./DashboardShell";

interface ShellWrapperProps {
  children: React.ReactNode;
  userData: any;
}

export function ShellWrapper({ children, userData }: ShellWrapperProps) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/onboarding";

  if (userData && !isOnboarding) {
    return (
      <DashboardShell 
        userRole={userData.role} 
        userName={userData.name}
        tenantName={userData.tenant_name}
        planId={userData.plan_id || "enterprise"}
      >
        {children}
      </DashboardShell>
    );
  }

  return <>{children}</>;
}
