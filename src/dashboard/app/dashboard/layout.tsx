// app/dashboard/layout.tsx
import React from 'react'
import { DashboardShell } from './DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell planId="enterprise">
      {children}
    </DashboardShell>
  )
}
