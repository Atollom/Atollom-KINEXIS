// components/dashboard/WorkspaceArea.tsx
'use client'

export function WorkspaceArea({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 bg-[#040f1b]">
      {children}
    </main>
  )
}
