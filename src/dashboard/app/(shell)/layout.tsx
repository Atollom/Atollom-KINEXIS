import { Sidebar } from '@/components/shell/Sidebar'
import { Header } from '@/components/shell/Header'
import { SamanthaFixedPanel } from '@/components/samantha/SamanthaFixedPanel'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#040f1b] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 h-full">
            {children}
          </div>
        </main>
      </div>
      <div className="hidden lg:flex w-96 border-l border-gray-700 bg-gray-900 flex-col">
        <SamanthaFixedPanel />
      </div>
    </div>
  )
}
