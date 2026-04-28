import { Sidebar } from '@/components/shell/Sidebar'
import { Header } from '@/components/shell/Header'
import { SamanthaFixedPanel } from '@/components/samantha/SamanthaFixedPanel'
import { BottomNav } from '@/components/BottomNav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
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
        <SamanthaFixedPanel />
      </div>
      <BottomNav />
    </div>
  )
}
