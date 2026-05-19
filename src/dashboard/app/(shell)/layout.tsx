import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shell/Sidebar'
import { Header } from '@/components/shell/Header'
import { DynamicSamanthaPanel } from '@/components/samantha/DynamicSamanthaPanel'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)

  // New user with no tenant → send to onboarding wizard
  if (!auth) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 pb-24 lg:pb-6 h-full">
            {children}
          </div>
        </main>
      </div>
      <div
        className="hidden lg:flex flex-shrink-0 w-96 flex-col"
        style={{ borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
      >
        <DynamicSamanthaPanel />
      </div>
      <BottomNav />
    </div>
  )
}
