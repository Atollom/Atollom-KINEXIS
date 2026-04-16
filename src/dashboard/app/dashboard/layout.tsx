// app/dashboard/layout.tsx
import { DashboardShell } from './DashboardShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In a real scenario, planId would come from auth/tenant data.
  // We'll default to 'enterprise' for the full V3 experience, but gating is active.
  return (
    <DashboardShell planId="enterprise">
      {children}
    </DashboardShell>
  )
}
