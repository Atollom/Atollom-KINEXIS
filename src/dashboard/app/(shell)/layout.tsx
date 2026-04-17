import { DashboardShell } from './dashboard/DashboardShell'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell planId="enterprise">{children}</DashboardShell>
}
